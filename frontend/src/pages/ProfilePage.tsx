import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { CompletedGameItem } from "../api/types";
import { GameCover } from "../components/GameCover";
import { LogoutIcon, PlayIcon, RefreshIcon } from "../components/Icons";
import { formatHours } from "../utils/format";

type PlayingGame = CompletedGameItem;

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState<PlayingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPlaying = useCallback(async () => {
    try {
      const { data } = await api.get<PlayingGame[]>("/games/playing");
      setPlaying(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaying();
  }, [loadPlaying]);

  async function changeStatus(game: PlayingGame, status: "COMPLETED" | "BACKLOG") {
    setBusyId(game.id);
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/status`, { status });
      setMessage({
        type: "ok",
        text: status === "COMPLETED" ? `${game.title} zerado!` : `${game.title} voltou ao backlog.`,
      });
      await loadPlaying();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  return (
    <main className="page">
      <h1>Perfil</h1>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <section className="profile-card" aria-label="Dados do usuário">
        <div className="profile-avatar" aria-hidden="true">
          {user?.username?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <strong className="profile-username">{user?.username}</strong>
          <span className="muted">{user?.email}</span>
        </div>
      </section>

      <section aria-label="Jogando agora">
        <h2 className="section-title">Jogando agora</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : playing.length === 0 ? (
          <div className="empty-state">
            <p>Nada em andamento.</p>
            <p className="muted">Escolha o próximo jogo no Dashboard para começar.</p>
          </div>
        ) : (
          <ul className="game-list">
            {playing.map((game) => (
              <li key={game.id} className="game-row">
                <GameCover src={game.coverImage} alt={game.title} className="thumb" />
                <div className="game-row-info">
                  <strong>{game.title}</strong>
                  <span className="muted">
                    Jogando desde {new Date(game.updatedAt).toLocaleDateString("pt-BR")}
                    {formatHours(game.hoursToBeat)
                      ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                      : ""}
                  </span>
                </div>
                <button
                  className="btn icon"
                  onClick={() => changeStatus(game, "COMPLETED")}
                  disabled={busyId === game.id}
                  aria-label={`Marcar ${game.title} como zerado`}
                >
                  <PlayIcon />
                </button>
                <button
                  className="btn icon"
                  onClick={() => changeStatus(game, "BACKLOG")}
                  disabled={busyId === game.id}
                  aria-label={`Devolver ${game.title} ao backlog`}
                >
                  <RefreshIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="btn danger full" onClick={handleLogout}>
        <LogoutIcon />
        Sair da conta
      </button>
    </main>
  );
}