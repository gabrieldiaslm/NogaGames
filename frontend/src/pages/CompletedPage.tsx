import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { CompletedGameItem } from "../api/types";
import { GameCover } from "../components/GameCover";
import { RefreshIcon } from "../components/Icons";
import { formatHours } from "../utils/format";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CompletedPage() {
  const { groupId = "" } = useParams();
  const [games, setGames] = useState<CompletedGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCompleted = useCallback(async () => {
    try {
      const { data } = await api.get<CompletedGameItem[]>(`/groups/${groupId}/completed`);
      setGames(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadCompleted();
  }, [loadCompleted]);

  async function reintegrate(game: CompletedGameItem) {
    setBusyId(game.id);
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/reintegrate`);
      setMessage({ type: "ok", text: `${game.title} voltou ao backlog.` });
      await loadCompleted();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <h1>Zerados</h1>
      <p className="page-subtitle">Seus jogos concluídos. Só vitória.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum jogo zerado ainda.</p>
          <p className="muted">Os jogos que você concluir aparecem aqui.</p>
        </div>
      ) : (
        <ul className="game-list">
          {games.map((game) => (
            <li key={game.id} className="game-row">
              <GameCover src={game.coverImage} alt={game.title} className="thumb" />
              <div className="game-row-info">
                <strong>{game.title}</strong>
                <span className="muted">
                  Zerado em {formatDate(game.updatedAt)}
                  {formatHours(game.hoursToBeat)
                    ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                    : ""}
                </span>
              </div>
              <button
                className="btn icon"
                onClick={() => reintegrate(game)}
                disabled={busyId === game.id}
                aria-label={`Reintegrar ${game.title} ao backlog`}
              >
                <RefreshIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}