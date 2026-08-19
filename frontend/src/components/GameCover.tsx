interface GameCoverProps {
  src: string;
  alt: string;
  className?: string;
}

export function GameCover({ src, alt, className }: GameCoverProps) {
  return (
    <img
      className={`game-cover${className ? ` ${className}` : ""}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        const img = event.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = `https://picsum.photos/seed/${encodeURIComponent(alt)}/200/300`;
        }
      }}
    />
  );
}