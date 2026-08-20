import { useState } from "react";
import { api, getErrorMessage } from "../api/client";
import { GameCover } from "./GameCover";
import { StarInput } from "./StarRating";
import { XIcon } from "./Icons";

const MAX_COMMENT = 500;

interface ReviewModalProps {
  game: { id: string; title: string; coverImage: string };
  onClose: () => void;
  onSaved: () => void;
  onMessage: (message: { type: "ok" | "error"; text: string }) => void;
}

export function ReviewModal({ game, onClose, onSaved, onMessage }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (rating === 0) {
      onMessage({ type: "error", text: "Escolha uma nota de 1 a 5 estrelas." });
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/games/${game.id}/status`, {
        status: "COMPLETED",
        rating,
        comment: comment.trim() || null,
      });
      onMessage({ type: "ok", text: `${game.title} zerado! Avaliação salva.` });
      onSaved();
      onClose();
    } catch (err) {
      onMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Avaliar ${game.title}`} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Você zerou {game.title}!</h2>
          <button className="btn icon" onClick={onClose} aria-label="Fechar">
            <XIcon />
          </button>
        </div>

        <div className="modal-body">
          <GameCover src={game.coverImage} alt={game.title} className="modal-cover" />
          <div className="modal-info review-form">
            <p className="muted">Avalie o jogo:</p>
            <StarInput value={rating} onChange={setRating} />
            <textarea
              className="review-textarea"
              placeholder="Comentário (opcional)"
              value={comment}
              maxLength={MAX_COMMENT}
              onChange={(event) => setComment(event.target.value)}
              aria-label="Comentário da avaliação"
            />
            <span className="muted char-counter">
              {comment.length}/{MAX_COMMENT}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}