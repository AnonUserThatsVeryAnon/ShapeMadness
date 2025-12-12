interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onResume, onRestart, onMainMenu }: PauseMenuProps) {
  return (
    <div className="pause-menu">
      <div className="pause-content">
        <h2>⏸️ Paused</h2>

        <div className="menu-buttons">
          <button onClick={onResume} className="btn-primary">
            ▶ Resume
          </button>
          <button onClick={onRestart} className="btn-secondary">
            🔄 Restart
          </button>
          <button onClick={onMainMenu} className="btn-secondary">
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
