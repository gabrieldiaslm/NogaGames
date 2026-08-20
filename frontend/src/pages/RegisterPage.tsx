import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AuthUser } from "../api/types";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: user } = await api.post<AuthUser>("/auth/register", {
        username,
        email,
        password,
      });
      const { data } = await api.post<{ token: string }>("/auth/login", {
        username,
        password,
      });
      login(data.token, user);
      navigate("/groups");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <h1>NogaGames</h1>
        <p>Crie sua conta e monte o backlog.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="banner error">{error}</div>}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="auth-switch">
        Já tem conta? <Link to="/auth/login">Entrar</Link>
      </p>
    </main>
  );
}