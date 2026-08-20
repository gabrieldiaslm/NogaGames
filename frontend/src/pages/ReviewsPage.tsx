import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { GroupReviewItem } from "../api/types";
import { GameCover } from "../components/GameCover";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReviewsPage() {
  const { groupId = "" } = useParams();
  const [reviews, setReviews] = useState<GroupReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await api.get<GroupReviewItem[]>(`/groups/${groupId}/reviews`);
      setReviews(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <main className="page">
      <h1>Reviews</h1>
      <p className="page-subtitle">O que a galera achou dos jogos zerados.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma avaliação ainda.</p>
          <p className="muted">Quando alguém zerar um jogo e avaliar, aparece aqui.</p>
        </div>
      ) : (
        <ul className="game-list">
          {reviews.map((review) => (
            <li key={review.id} className="review-feed-card">
              <GameCover src={review.game.coverImage} alt={review.game.title} className="thumb" />
              <div className="review-feed-info">
                <div className="review-head">
                  {review.user.avatarUrl ? (
                    <img className="avatar" src={review.user.avatarUrl} alt="" />
                  ) : (
                    <span className="profile-avatar small" aria-hidden="true">
                      {review.user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <strong>{review.user.username}</strong>
                </div>
                <strong className="review-feed-game">{review.game.title}</strong>
                <div className="review-feed-meta">
                  <span className="star-inline" aria-hidden="true">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="muted"> · {formatDate(review.createdAt)}</span>
                </div>
                {review.comment && <p className="review-comment">"{review.comment}"</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}