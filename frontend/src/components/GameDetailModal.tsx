import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";
import type { Voter } from "../api/types";
import { GameCover } from "./GameCover";
import { PlayIcon, ThumbsUpIcon, XIcon } from "./Icons";
import { formatHours } from "../utils/format";

export interface ModalGame {
  id: string;
  title: string;
  coverImage: string;
  votesCount: number;
  userVoted: boolean;
  hoursToBeat: number | null;
}

interface GameDetailModalProps {
  game: ModalGame;
  onClose: () => void;
  onChanged: () => void;
  onStartPlaying: (game: ModalGame) => void;
  onShowMessage: (message: { type: "ok" | "error"; text: string }) => void;
}

export function GameDetailModal({
  game,
  onClose,
  onChanged,
  onStartPlaying,
  onShowMessage,
}: GameDetailModalProps) {
  const [voters, setVoters] = useState<Voter[] | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Voter[]>(`/games/${game.id}/votes`)
      .then(({ data }) => {
        if (!cancelled) setVoters(data);
      })
      .catch((err) => {
        if (!cancelled) onShowMessage({ type: "error", text: getErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  async function toggleVote() {
    setVoting(true);
    try {
      if (game.userVoted) {
        await api.delete(`/games/${game.id}/vote`);
      } else {
        await api.post(`/games/${game.id}/vote`);
      }
      onChanged();
      onClose();
    } catch (err) {
      onShowMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Detalhes de ${game.title}`} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{game.title}</h2>
          <button className="btn icon" onClick={onClose} aria-label="Fechar detalhes">
            <XIcon />
          </button>
        </div>

        <div className="modal-body">
          <GameCover src={game.coverImage} alt={game.title} className="modal-cover" />
          <div className="modal-info">
            <p className="muted">
              {game.votesCount} {game.votesCount === 1 ? "voto" : "votos"}
              {formatHours(game.hoursToBeat) ? ` \u00b7 ${formatHours(game.hoursToBeat)}` : ""}
            </p>
            <h3 className="section-title">Quem quer jogar</h3>
            {voters === null ? (
              <p className="muted">Carregando...</p>
            ) : voters.length === 0 ? (
              <p className="muted">Ninguém votou ainda. Seja o primeiro!</p>
            ) : (
              <ul className="voter-list">
                {voters.map((voter) => (
                  <li key={voter.id} className="voter-item">
                    {voter.avatarUrl ? (
                      <img className="avatar" src={voter.avatarUrl} alt="" />
                    ) : (
                      <span className="profile-avatar small" aria-hidden="true">
                        {voter.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{voter.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className={`btn${game.userVoted ? " voted" : ""}`}
            onClick={toggleVote}
            disabled={voting}
          >
            <ThumbsUpIcon filled={game.userVoted} />
            {game.userVoted ? "Remover voto" : "Votar"}
          </button>
          <button
            className="btn primary"
            onClick={() => onStartPlaying(game)}
            disabled={voting}
          >
            <PlayIcon />
            Começar a jogar
          </button>
        </div>
      </div>
    </div>
  );
}