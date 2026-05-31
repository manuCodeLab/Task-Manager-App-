# Task Manager App

A small full-stack task manager for the intern assignment. Users can register, log in, and manage tasks across `Todo`, `In Progress`, and `Done`.

## Features

- Register and login flow
- JWT-protected backend APIs
- Create, update, delete, and move tasks between stages
- Responsive three-stage task board
- Loading, empty, and error states
- MongoDB persistence for deployed records

## Tech Stack

- Frontend: React, Vite, plain CSS
- Backend: Node.js, Express, JWT, bcryptjs
- Database: MongoDB with Mongoose

## Project Structure

```text
backend/   Express API, auth, task routes, MongoDB setup
frontend/  React/Vite app
```

## Local Setup

Install and run the backend:

```bash
cd backend
npm install
npm run dev
```

Install and run the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:4000`.

## Environment Variables

Backend:

```env
PORT=4000
JWT_SECRET=replace-this-with-a-long-secret
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-manager
```

Frontend:

```env
VITE_API_URL=http://localhost:4000/api
```

For local development, the frontend can also use its built-in Vite proxy and call `/api` when `VITE_API_URL` is not set.

## Deployment

Frontend deployment is mandatory. A simple option is Vercel or Netlify:

1. Set the frontend root directory to `frontend`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Add `VITE_API_URL` with the deployed backend API URL, for example `https://your-api.onrender.com/api`.

Backend deployment is included because AI assistance was used. A simple option is Render:

1. Set the backend root directory to `backend`.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Add `JWT_SECRET`, `MONGODB_URI`, and `CLIENT_ORIGIN`.
5. Set `CLIENT_ORIGIN` to the deployed frontend URL, for example `https://your-app.vercel.app`.

The repository includes `render.yaml` for Render and `frontend/vercel.json` for Vercel.

## Assumptions and Tradeoffs

- A custom backend is included to satisfy the AI-assisted development condition.
- MongoDB Atlas is assumed for the hosted database because it has a free tier and works well with Render/Vercel deployments.
- Passwords are hashed with bcryptjs and API access is protected with JWT.
- Tasks are private to the logged-in user.

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
