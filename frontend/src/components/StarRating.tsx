interface StarRatingProps {
  value: number;
  size?: number;
}

export function StarRating({ value, size = 18 }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;

  return (
    <span
      className="star-rating"
      role="img"
      aria-label={`${clamped.toFixed(1)} de 5 estrelas`}
      style={{ fontSize: size }}
    >
      <span className="star-row" aria-hidden="true">
        <span className="star-empty">★★★★★</span>
        <span className="star-fill" style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="star-number">{clamped.toFixed(1)}</span>
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarInput({ value, onChange }: StarInputProps) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrela${star === 1 ? "" : "s"}`}
          className={`star-btn${value >= star ? " selected" : ""}`}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}