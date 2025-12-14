import React, { useState } from "react";
import "./NameInputScreen.css";

interface NameInputScreenProps {
  score: number;
  wave: number;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export const NameInputScreen: React.FC<NameInputScreenProps> = ({
  score,
  wave,
  onSubmit,
  onSkip,
}) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      alert("Name must be at least 2 characters");
      return;
    }
    if (name.trim().length > 20) {
      alert("Name must be at most 20 characters");
      return;
    }

    setIsSubmitting(true);
    await onSubmit(name.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="name-input-screen">
      <div className="name-input-content">
        <h1 className="name-input-title">💀 GAME OVER 💀</h1>

        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wave</span>
            <span className="stat-value">{wave}</span>
          </div>
        </div>

        <h2 className="submit-prompt">Submit to Leaderboard</h2>

        <form onSubmit={handleSubmit} className="name-form">
          <input
            type="text"
            className="name-input"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            disabled={isSubmitting}
          />

          <div className="name-actions">
            <button
              type="submit"
              className="btn btn-submit"
              disabled={isSubmitting || name.trim().length < 2}
            >
              {isSubmitting ? "Submitting..." : "Submit Score"}
            </button>
            <button
              type="button"
              className="btn btn-skip"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip
            </button>
          </div>
        </form>

        <p className="name-hint">2-20 characters</p>
      </div>
    </div>
  );
};
