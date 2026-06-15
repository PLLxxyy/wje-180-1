export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 18
}: {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''} ${readonly ? 'star-readonly' : ''}`}
          style={{ fontSize: size }}
          onClick={() => !readonly && onChange?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
