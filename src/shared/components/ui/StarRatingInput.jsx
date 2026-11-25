import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRatingInput.css';

export default function StarRatingInput({ value, onChange, disabled = false }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const selectedRating = Number(value);
  const visibleRating = hoveredRating || selectedRating;

  return (
    <div
      className="star-rating-input"
      role="radiogroup"
      aria-label="Nota da avaliação"
      onMouseLeave={() => setHoveredRating(0)}
    >
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          className={`star-rating-input__star ${rating <= visibleRating ? 'is-selected' : ''}`}
          type="button"
          role="radio"
          aria-checked={selectedRating === rating}
          aria-label={`${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`}
          title={`${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`}
          disabled={disabled}
          key={rating}
          onMouseEnter={() => setHoveredRating(rating)}
          onFocus={() => setHoveredRating(rating)}
          onBlur={() => setHoveredRating(0)}
          onClick={() => onChange(String(rating))}
        >
          <Star size={24} fill="currentColor" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
