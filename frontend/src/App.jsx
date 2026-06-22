import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TARGET_DATE = new Date("2026-10-15T00:00:00+09:00");
const COMMENTS_PER_PAGE = 10;

function getRemainingTime() {
  const difference = Math.max(TARGET_DATE.getTime() - Date.now(), 0);

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateText));
}

function App() {
  const [remainingTime, setRemainingTime] = useState(getRemainingTime);
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: COMMENTS_PER_PAGE,
    total: 0,
    totalPages: 1
  });
  const [form, setForm] = useState({ nickname: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const countdownText = useMemo(
    () =>
      `${remainingTime.days}일 ${remainingTime.hours}시간 ${remainingTime.minutes}분 ${remainingTime.seconds}초`,
    [remainingTime]
  );

  const fetchComments = useCallback(async (page = 1) => {
    const response = await fetch(
      `${API_BASE_URL}/api/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`
    );

    if (!response.ok) {
      throw new Error("댓글을 불러오지 못했습니다.");
    }

    const data = await response.json();
    setComments(data.comments);
    setPagination(data.pagination);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRemainingTime(getRemainingTime());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    fetchComments().catch((error) => setErrorMessage(error.message));
  }, [fetchComments]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "댓글 등록에 실패했습니다.");
      }

      setForm({ nickname: "", message: "" });
      await fetchComments(1);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function movePage(nextPage) {
    fetchComments(nextPage).catch((error) => setErrorMessage(error.message));
  }

  return (
    <main className="page">
      <section className="hero" aria-label="카운트다운">
        <img className="character-image" src="/character.png" alt="Just Day 캐릭터" />
        <p className="countdown">
          10월 15일 까지 남은 시간은 <strong>{countdownText}</strong> 남았습니다
        </p>
      </section>

      <section className="comments" aria-label="응원의 한마디">
        <form className="comment-form" onSubmit={handleSubmit}>
          <label>
            이름
            <input
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              maxLength={20}
              placeholder="익명"
            />
          </label>

          <label>
            응원의 한마디
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              maxLength={200}
              placeholder="응원의 한마디를 남겨주세요"
              required
            />
          </label>

          <div className="form-footer">
            <span>{form.message.length}/200</span>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "등록 중" : "등록"}
            </button>
          </div>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="empty-message">아직 등록된 응원의 한마디가 없습니다.</p>
          ) : (
            comments.map((comment) => (
              <article className="comment-item" key={comment.id}>
                <p className="comment-message">{comment.message}</p>
                <div className="comment-author">
                  <strong>{comment.nickname}</strong>
                  <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="pagination" aria-label="댓글 페이지">
          <button
            type="button"
            onClick={() => movePage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            이전
          </button>
          <span>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => movePage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            다음
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
