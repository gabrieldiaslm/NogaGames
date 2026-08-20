import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AuthUser } from "../api/types";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        username,
        password,
      });
      const profile = await api.get<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      login(data.token, profile.data);
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
        <p>Decida o próximo jogo sem indecisão.</p>
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
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth-switch">
        Não tem conta? <Link to="/auth/register">Cadastre-se</Link>
      </p>
    </main>
  );
}