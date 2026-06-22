import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commentsFilePath = path.join(__dirname, "../data/comments.json");
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "just-day-release-api"
  });
});

async function readComments() {
  if (supabase) {
    const { data, error } = await supabase
      .from("support_comments")
      .select("id,nickname,message,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((comment) => ({
      id: comment.id,
      nickname: comment.nickname,
      message: comment.message,
      createdAt: comment.created_at
    }));
  }

  try {
    const file = await fs.readFile(commentsFilePath, "utf8");
    return JSON.parse(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeComments(comments) {
  await fs.mkdir(path.dirname(commentsFilePath), { recursive: true });
  await fs.writeFile(commentsFilePath, JSON.stringify(comments, null, 2));
}

app.get("/api/comments", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page ?? "1", 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit ?? "10", 10), 1),
      10
    );
    const comments = await readComments();
    const sortedComments = supabase
      ? comments
      : comments.toSorted((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = sortedComments.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;

    res.json({
      comments: sortedComments.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/comments", async (req, res, next) => {
  try {
    const nickname = String(req.body.nickname ?? "익명").trim() || "익명";
    const message = String(req.body.message ?? "").trim();

    if (!message) {
      return res.status(400).json({ message: "응원의 한마디를 입력해주세요." });
    }

    if (nickname.length > 20 || message.length > 200) {
      return res.status(400).json({
        message: "이름은 20자, 응원 메시지는 200자 이하로 입력해주세요."
      });
    }

    const comment = {
      id: crypto.randomUUID(),
      nickname,
      message,
      createdAt: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("support_comments")
        .insert({
          nickname: comment.nickname,
          message: comment.message
        })
        .select("id,nickname,message,created_at")
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        id: data.id,
        nickname: data.nickname,
        message: data.message,
        createdAt: data.created_at
      });
    }

    const comments = await readComments();
    comments.push(comment);
    await writeComments(comments);

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "서버에서 문제가 발생했습니다." });
});

export default app;
