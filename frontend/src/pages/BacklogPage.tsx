import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";
import type { BacklogGameItem } from "../api/types";
import { GameCover } from "../components/GameCover";
import { PlayIcon, ThumbsUpIcon } from "../components/Icons";
import { formatHours } from "../utils/format";

export function BacklogPage() {
  const [games, setGames] = useState<BacklogGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBacklog = useCallback(async () => {
    try {
      const { data } = await api.get<BacklogGameItem[]>("/games/backlog");
      setGames(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  async function toggleVote(game: BacklogGameItem) {
    setBusyId(game.id);
    setMessage(null);
    try {
      if (game.userVoted) {
        await api.delete(`/games/${game.id}/vote`);
      } else {
        await api.post(`/games/${game.id}/vote`);
      }
      await loadBacklog();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  async function startPlaying(game: BacklogGameItem) {
    setBusyId(game.id);
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/status`, { status: "PLAYING" });
      setMessage({ type: "ok", text: `${game.title} movido para "jogando".` });
      await loadBacklog();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <h1>Backlog</h1>
      <p className="page-subtitle">Vote no próximo jogo para zerar.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <p>Backlog vazio.</p>
          <p className="muted">Adicione jogos pela busca no Dashboard para começar a votação.</p>
        </div>
      ) : (
        <ul className="game-list">
          {games.map((game) => (
            <li key={game.id} className="game-row">
              <GameCover src={game.coverImage} alt={game.title} className="thumb" />
              <div className="game-row-info">
                <strong>{game.title}</strong>
                <span className="muted">
                  {game.votesCount} {game.votesCount === 1 ? "voto" : "votos"}
                  {formatHours(game.hoursToBeat)
                    ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                    : ""}
                </span>
              </div>
              <button
                className={`btn icon vote${game.userVoted ? " voted" : ""}`}
                onClick={() => toggleVote(game)}
                disabled={busyId === game.id}
                aria-label={game.userVoted ? `Remover voto de ${game.title}` : `Votar em ${game.title}`}
                aria-pressed={game.userVoted}
              >
                <ThumbsUpIcon filled={game.userVoted} />
              </button>
              <button
                className="btn icon"
                onClick={() => startPlaying(game)}
                disabled={busyId === game.id}
                aria-label={`Começar a jogar ${game.title}`}
              >
                <PlayIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}