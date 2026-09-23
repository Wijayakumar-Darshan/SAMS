import React from "react";
import { StarIcon } from "./UI/Icons.jsx";

export default function Stars({ value = 0, onChange, readOnly = false, size = 20 }) {
  const currentVal = Number(value || 0);

  return (
    <div className="sams-stars" role="radiogroup" aria-label={`Rating: ${currentVal} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((starNum) => {
        const isFilled = starNum <= currentVal;

        if (readOnly) {
          return (
            <span
              key={starNum}
              className={`sams-star-static ${isFilled ? "filled" : "empty"}`}
              style={{ width: size, height: size }}
            >
              <StarIcon
                size={size}
                color={isFilled ? "#F59E0B" : "#CBD5E1"}
                strokeWidth={isFilled ? 0 : 1.5}
                style={{ fill: isFilled ? "#F59E0B" : "none" }}
              />
            </span>
          );
        }

        return (
          <button
            key={starNum}
            type="button"
            className={`sams-star-btn ${isFilled ? "filled" : "empty"}`}
            onClick={() => onChange && onChange(starNum)}
            aria-label={`Rate ${starNum} star${starNum > 1 ? "s" : ""}`}
            style={{ width: size + 8, height: size + 8 }}
          >
            <StarIcon
              size={size}
              color={isFilled ? "#F59E0B" : "#94A3B8"}
              strokeWidth={isFilled ? 0 : 1.5}
              style={{ fill: isFilled ? "#F59E0B" : "none" }}
            />
          </button>
        );
      })}

      <style>{`
        .sams-stars {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .sams-star-static {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .sams-star-btn {
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .sams-star-btn:hover {
          transform: scale(1.22);
        }

        .sams-star-btn:focus-visible {
          outline: 2px solid var(--accent);
        }

        .sams-star-btn.filled svg {
          filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4));
        }
      `}</style>
    </div>
  );
}