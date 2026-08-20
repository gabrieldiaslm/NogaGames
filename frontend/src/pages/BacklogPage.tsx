import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { BacklogGameItem } from "../api/types";
import { GameDetailModal, type ModalGame } from "../components/GameDetailModal";
import { GameCover } from "../components/GameCover";
import { formatHours } from "../utils/format";

export function BacklogPage() {
  const { groupId = "" } = useParams();
  const [games, setGames] = useState<BacklogGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [selected, setSelected] = useState<ModalGame | null>(null);

  const loadBacklog = useCallback(async () => {
    try {
      const { data } = await api.get<BacklogGameItem[]>(`/groups/${groupId}/backlog`);
      setGames(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  async function startPlaying(game: ModalGame) {
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/status`, { status: "PLAYING" });
      setMessage({ type: "ok", text: `${game.title} movido para "jogando".` });
      setSelected(null);
      await loadBacklog();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
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
                className="btn icon detail"
                onClick={() =>
                  setSelected({
                    id: game.id,
                    title: game.title,
                    coverImage: game.coverImage,
                    votesCount: game.votesCount,
                    userVoted: game.userVoted,
                    hoursToBeat: game.hoursToBeat,
                  })
                }
                aria-label={`Ver detalhes de ${game.title}`}
              >
                {game.userVoted ? "\u2764" : "\u2192"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <GameDetailModal
          game={selected}
          onClose={() => setSelected(null)}
          onChanged={loadBacklog}
          onStartPlaying={startPlaying}
          onShowMessage={setMessage}
        />
      )}
    </main>
  );
}