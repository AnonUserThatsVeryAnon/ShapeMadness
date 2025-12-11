// Settings Menu Component
import { useState } from "react";
import type { GameSettings } from "../config/gameConfig";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from "../config/gameConfig";
import "./SettingsMenu.css";

interface SettingsMenuProps {
  onClose: () => void;
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());

  const updateSetting = <K extends keyof GameSettings>(
    category: K,
    key: keyof GameSettings[K],
    value: GameSettings[K][typeof key]
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        <h2>⚙️ Settings</h2>

        {/* Audio Settings */}
        <div className="settings-section">
          <h3>🔊 Audio</h3>

          <label>
            Master Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.audio.master}
              onChange={(e) =>
                updateSetting("audio", "master", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(settings.audio.master * 100)}%</span>
          </label>

          <label>
            SFX Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.audio.sfx}
              onChange={(e) =>
                updateSetting("audio", "sfx", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(settings.audio.sfx * 100)}%</span>
          </label>

          <label>
            Music Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.audio.music}
              onChange={(e) =>
                updateSetting("audio", "music", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(settings.audio.music * 100)}%</span>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.audio.muted}
              onChange={(e) =>
                updateSetting("audio", "muted", e.target.checked)
              }
            />
            Mute All Audio
          </label>
        </div>

        {/* Graphics Settings */}
        <div className="settings-section">
          <h3>🎨 Graphics</h3>

          <label>
            Particle Quality
            <select
              value={settings.graphics.particles}
              onChange={(e) =>
                updateSetting(
                  "graphics",
                  "particles",
                  e.target.value as "low" | "medium" | "high"
                )
              }
            >
              <option value="low">Low (Better Performance)</option>
              <option value="medium">Medium</option>
              <option value="high">High (More Particles)</option>
            </select>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.graphics.screenShake}
              onChange={(e) =>
                updateSetting("graphics", "screenShake", e.target.checked)
              }
            />
            Screen Shake
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.graphics.showFPS}
              onChange={(e) =>
                updateSetting("graphics", "showFPS", e.target.checked)
              }
            />
            Show FPS Counter
          </label>
        </div>

        {/* Gameplay Settings */}
        <div className="settings-section">
          <h3>🎮 Gameplay</h3>

          <label>
            Difficulty
            <select
              value={settings.gameplay.difficulty}
              onChange={(e) =>
                updateSetting(
                  "gameplay",
                  "difficulty",
                  e.target.value as "easy" | "normal" | "hard"
                )
              }
            >
              <option value="easy">Easy (More forgiving)</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard (More challenge)</option>
            </select>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.gameplay.autoSave}
              onChange={(e) =>
                updateSetting("gameplay", "autoSave", e.target.checked)
              }
            />
            Auto-Save Between Rounds
          </label>
        </div>

        {/* Accessibility Settings */}
        <div className="settings-section">
          <h3>♿ Accessibility</h3>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.accessibility.colorBlindMode}
              onChange={(e) =>
                updateSetting(
                  "accessibility",
                  "colorBlindMode",
                  e.target.checked
                )
              }
            />
            Color Blind Mode
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.accessibility.reducedMotion}
              onChange={(e) =>
                updateSetting(
                  "accessibility",
                  "reducedMotion",
                  e.target.checked
                )
              }
            />
            Reduced Motion
          </label>
        </div>

        {/* Buttons */}
        <div className="settings-buttons">
          <button onClick={resetToDefaults} className="btn-secondary">
            Reset to Defaults
          </button>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
