import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
};

type Note = {
  id: string;
  title: string;
  category: Category;
  content: string;
  created_at: string;
  updated_at: string;
};

type Category = "Docker" | "Linux" | "Kubernetes" | "CI/CD" | "General";

const categories: Category[] = ["Docker", "Linux", "Kubernetes", "CI/CD", "General"];
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const emptyNote = {
  title: "",
  category: "General" as Category,
  content: ""
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") ?? "");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState(emptyNote);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${apiUrl}/auth/me`, { headers: authHeaders })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => logout());
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    loadNotes();
  }, [user, token]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Authentication failed");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes() {
    const response = await fetch(`${apiUrl}/notes`, { headers: authHeaders });
    const data = await response.json();
    setNotes(data.notes ?? []);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/notes${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(draft)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Could not save note");
      }

      setDraft(emptyNote);
      setEditingId(null);
      await loadNotes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save note");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: string) {
    await fetch(`${apiUrl}/notes/${id}`, {
      method: "DELETE",
      headers: authHeaders
    });
    await loadNotes();
  }

  function editNote(note: Note) {
    setEditingId(note.id);
    setDraft({
      title: note.title,
      category: note.category,
      content: note.content
    });
  }

  function logout() {
    if (token) {
      fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: authHeaders }).catch(() => undefined);
    }
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setNotes([]);
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div>
            <p className="eyebrow">DevOps Toolbox</p>
            <h1>{authMode === "login" ? "Sign in" : "Create account"}</h1>
          </div>

          <form onSubmit={handleAuth}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                minLength={8}
                required
              />
            </label>
            {message && <p className="error">{message}</p>}
            <button disabled={loading}>{loading ? "Working..." : authMode === "login" ? "Login" : "Register"}</button>
          </form>

          <button className="link-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? "Need an account?" : "Already registered?"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal dashboard</p>
          <h1>DevOps Toolbox</h1>
        </div>
        <div className="session">
          <span>{user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="workspace">
        <form className="note-form" onSubmit={saveNote}>
          <h2>{editingId ? "Edit note" : "New note"}</h2>
          <label>
            Title
            <input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              required
            />
          </label>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Content
            <textarea
              value={draft.content}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              rows={9}
              required
            />
          </label>
          {message && <p className="error">{message}</p>}
          <div className="form-actions">
            <button disabled={loading}>{editingId ? "Update note" : "Create note"}</button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyNote);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="notes-list">
          <h2>Notes</h2>
          {notes.length === 0 ? (
            <p className="empty">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="note-card-header">
                  <div>
                    <span className="badge">{note.category}</span>
                    <h3>{note.title}</h3>
                  </div>
                  <div className="note-actions">
                    <button className="secondary" onClick={() => editNote(note)}>
                      Edit
                    </button>
                    <button className="danger" onClick={() => deleteNote(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p>{note.content}</p>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
