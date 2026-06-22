# just_day_-release

Node backend and React frontend project structure.

## Structure

```text
backend/
  src/
    app.js
    server.js
frontend/
  src/
    App.jsx
    App.css
    main.jsx
```

## Setup

```bash
npm run install:all
```

## Run

Backend:

```bash
npm run backend
```

Frontend:

```bash
npm run frontend
```

Default URLs:

- Backend: http://localhost:4000
- Frontend: http://localhost:5173

## Supabase

Run `backend/supabase.sql` in the Supabase SQL editor, then set these backend
environment variables:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

If Supabase variables are not set, the backend stores comments in
`backend/data/comments.json` for local development.
