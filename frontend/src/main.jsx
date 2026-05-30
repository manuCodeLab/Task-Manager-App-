import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const stages = ["Todo", "In Progress", "Done"];

async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = mode === "register" ? form : { email: form.email, password: form.password };
      const data = await apiRequest(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Task Manager</p>
          <h1>Plan the work. Move it forward.</h1>
          <p className="auth-copy">Sign in to manage your private board across Todo, In Progress, and Done.</p>
        </div>

        <div className="mode-switch" aria-label="Authentication mode">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="At least 6 characters"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
            {mode === "register" ? "Create account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

function TaskForm({ onCreate, busy }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("Todo");

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreate({ title, description, stage });
    setTitle("");
    setDescription("");
    setStage("Todo");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a task" />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Short description"
      />
      <select value={stage} onChange={(event) => setStage(event.target.value)} aria-label="Task stage">
        {stages.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className="primary-button compact" disabled={busy || !title.trim()} type="submit">
        {busy ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}
        Add
      </button>
    </form>
  );
}

function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: task.title, description: task.description });

  async function saveEdit() {
    await onUpdate(task.id, draft);
    setEditing(false);
  }

  return (
    <article className="task-card">
      {editing ? (
        <div className="edit-fields">
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            rows="3"
          />
          <div className="card-actions">
            <button onClick={saveEdit} type="button">
              Save
            </button>
            <button onClick={() => setEditing(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="task-card-header">
            <h3>{task.title}</h3>
            <button className="icon-button danger" onClick={() => onDelete(task.id)} type="button" aria-label="Delete task">
              <Trash2 size={16} />
            </button>
          </div>
          {task.description && <p>{task.description}</p>}
          <div className="card-actions">
            <select value={task.stage} onChange={(event) => onUpdate(task.id, { stage: event.target.value })}>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
            <button onClick={() => setEditing(true)} type="button">
              Edit
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function Board({ auth, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const groupedTasks = useMemo(
    () =>
      stages.reduce((groups, stage) => {
        groups[stage] = tasks.filter((task) => task.stage === stage);
        return groups;
      }, {}),
    [tasks]
  );

  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/tasks", { token: auth.token });
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function createTask(payload) {
    setBusy(true);
    setError("");

    try {
      const data = await apiRequest("/tasks", {
        token: auth.token,
        method: "POST",
        body: JSON.stringify(payload)
      });
      setTasks((current) => [data.task, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateTask(id, payload) {
    setError("");

    try {
      const data = await apiRequest(`/tasks/${id}`, {
        token: auth.token,
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setTasks((current) => current.map((task) => (task.id === id ? data.task : task)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    setError("");

    try {
      await apiRequest(`/tasks/${id}`, {
        token: auth.token,
        method: "DELETE"
      });
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Welcome, {auth.user.name}</p>
          <h1>Task Board</h1>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          <LogOut size={17} />
          Logout
        </button>
      </header>

      <TaskForm onCreate={createTask} busy={busy} />

      {error && <p className="error-message board-error">{error}</p>}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={24} />
          Loading tasks...
        </div>
      ) : (
        <section className="board" aria-label="Task stages">
          {stages.map((stage) => (
            <div className="stage-column" key={stage}>
              <div className="stage-header">
                <h2>{stage}</h2>
                <span>{groupedTasks[stage].length}</span>
              </div>

              <div className="task-list">
                {groupedTasks[stage].length === 0 ? (
                  <p className="empty-state">No tasks here yet.</p>
                ) : (
                  groupedTasks[stage].map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                  ))
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("task-manager-auth");
    return saved ? JSON.parse(saved) : null;
  });

  function handleAuth(data) {
    localStorage.setItem("task-manager-auth", JSON.stringify(data));
    setAuth(data);
  }

  function handleLogout() {
    localStorage.removeItem("task-manager-auth");
    setAuth(null);
  }

  return auth ? <Board auth={auth} onLogout={handleLogout} /> : <AuthScreen onAuth={handleAuth} />;
}

createRoot(document.getElementById("root")).render(<App />);
