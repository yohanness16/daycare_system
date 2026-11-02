import React, { useState } from 'react';

interface RatingStarsProps {
  initialRating?: number | null;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  initialRating = 0,
  onRate,
  readOnly = false,
  size = 'md',
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const currentRating = initialRating || 0;

  const sizeClass = {
    sm: 'text-[18px]',
    md: 'text-[24px]',
    lg: 'text-[32px]',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || currentRating) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onRate && onRate(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            className={`transition-transform ${
              readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
            } ${isFilled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          >
            <span
              className={`material-symbols-outlined ${sizeClass[size]} ${
                isFilled ? 'font-fill' : ''
              }`}
              style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
};
