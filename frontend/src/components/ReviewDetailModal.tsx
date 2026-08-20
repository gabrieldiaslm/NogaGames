import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";
import type { CompletedGameItem, ReviewItem } from "../api/types";
import { GameCover } from "./GameCover";
import { StarRating } from "./StarRating";
import { XIcon } from "./Icons";

interface ReviewDetailModalProps {
  game: CompletedGameItem;
  onClose: () => void;
  onMessage: (message: { type: "ok" | "error"; text: string }) => void;
}

export function ReviewDetailModal({ game, onClose, onMessage }: ReviewDetailModalProps) {
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ReviewItem[]>(`/games/${game.id}/reviews`)
      .then(({ data }) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err) => {
        if (!cancelled) onMessage({ type: "error", text: getErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Avaliações de ${game.title}`} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{game.title}</h2>
          <button className="btn icon" onClick={onClose} aria-label="Fechar avaliações">
            <XIcon />
          </button>
        </div>

        <div className="modal-body">
          <GameCover src={game.coverImage} alt={game.title} className="modal-cover" />
          <div className="modal-info">
            <p className="muted">
              {game.releaseYear ?? "Ano desconhecido"}
              {game.genre ? ` \u00b7 ${game.genre}` : ""}
              {game.platform ? ` \u00b7 ${game.platform}` : ""}
            </p>
            <StarRating value={game.avgRating ?? 0} />
            <p className="muted">
              {game.reviewsCount} avaliaç{game.reviewsCount === 1 ? "ão" : "ões"}
            </p>
          </div>
        </div>

        <h3 className="section-title">Avaliações do grupo</h3>
        {reviews === null ? (
          <p className="muted">Carregando...</p>
        ) : reviews.length === 0 ? (
          <p className="muted">Ninguém avaliou este jogo ainda.</p>
        ) : (
          <ul className="voter-list">
            {reviews.map((review) => (
              <li key={review.id} className="review-item">
                <div className="review-head">
                  {review.user.avatarUrl ? (
                    <img className="avatar" src={review.user.avatarUrl} alt="" />
                  ) : (
                    <span className="profile-avatar small" aria-hidden="true">
                      {review.user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <strong>{review.user.username}</strong>
                  <span className="star-inline" aria-hidden="true">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && <p className="review-comment">"{review.comment}"</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}