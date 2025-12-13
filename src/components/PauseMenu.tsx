interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onResume, onRestart, onMainMenu }: PauseMenuProps) {
  return (
    <div className="menu-overlay pause-overlay">
      <h1 className="pause-title">⏸️ PAUSED</h1>
      <button className="menu-button" onClick={onResume}>
        RESUME
      </button>
      <button className="menu-button secondary" onClick={onRestart}>
        RESTART
      </button>
      <button className="menu-button secondary" onClick={onMainMenu}>
        QUIT TO MENU
      </button>
    </div>
  );
}
