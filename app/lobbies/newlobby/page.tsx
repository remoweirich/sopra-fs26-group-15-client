"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";
import { useAuth } from "@/context/AuthContext";

const ROUND_OPTIONS = [1, 3, 5, 10] as const;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;

const NewLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const { user: currentUser, token, login } = useAuth();

  const [lobbyName, setLobbyName] = useState("");
  const [size, setSize] = useState(6);
  const [maxRounds, setMaxRounds] = useState<number>(5);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyName.trim()) {
      setError("Bitte gib einen Lobby-Namen ein.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload: CreateLobbyPostDTO = {
        lobbyName: lobbyName.trim(),
        size: Number(size),
        maxRounds: Number(maxRounds),
        visibility,
      };
      const response = await apiService.post<LobbyAccessDTO>(
        "/lobbies",
        payload,
        {
          headers: {
            token: token ? token : "",
            userId: currentUser ? currentUser.userId.toString() : "-1",
          },
        }
      );

      await login(response.token, response.userId);

      const lobbyCodeDTO: LobbyCodeDTO = { lobbyCode: response.lobbyCode };
      handleJoin(response.lobbyId, lobbyCodeDTO, {
        userId: response.userId,
        token: response.token,
      });
    } catch (err) {
      console.error("Lobby creation failed:", err);
      setError("Lobby konnte nicht erstellt werden. Bitte versuch es erneut.");
      setSubmitting(false);
    }
  };

  return (
    <div className="newlobby-page">
      <form className="newlobby-card" onSubmit={handleCreate} noValidate>
        <span className="eyebrow eyebrow--red">Neue Lobby</span>
        <h2 className="newlobby-title">Set up your game</h2>
        <p className="newlobby-subtitle">Konfiguriere deine Runde.</p>

        {/* Lobby name */}
        <div className="newlobby-field">
          <span className="eyebrow eyebrow--grey">Lobby-Name</span>
          <input
            className="auth-input newlobby-input"
            value={lobbyName}
            onChange={(e) => setLobbyName(e.target.value.slice(0, 28))}
            placeholder="Züri-Express"
            maxLength={28}
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Player count stepper */}
        <div className="newlobby-field">
          <div className="newlobby-field-header">
            <span className="eyebrow eyebrow--grey">Spieleranzahl</span>
            <span className="newlobby-hint">{MIN_PLAYERS}–{MAX_PLAYERS}</span>
          </div>
          <div className="newlobby-stepper">
            <button
              type="button"
              className="newlobby-stepper-btn"
              onClick={() => setSize((s) => Math.max(MIN_PLAYERS, s - 1))}
              disabled={size <= MIN_PLAYERS}
              aria-label="Weniger Spieler"
            >
              −
            </button>
            <div className="newlobby-stepper-value">{size}</div>
            <button
              type="button"
              className="newlobby-stepper-btn"
              onClick={() => setSize((s) => Math.min(MAX_PLAYERS, s + 1))}
              disabled={size >= MAX_PLAYERS}
              aria-label="Mehr Spieler"
            >
              +
            </button>
          </div>
        </div>

        {/* Rounds segmented */}
        <div className="newlobby-field">
          <span className="eyebrow eyebrow--grey">Runden</span>
          <div className="newlobby-segmented" role="radiogroup" aria-label="Runden">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={maxRounds === n}
                className={
                  "newlobby-seg-btn" +
                  (maxRounds === n ? " newlobby-seg-btn--active" : "")
                }
                onClick={() => setMaxRounds(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="newlobby-field">
          <span className="eyebrow eyebrow--grey">Sichtbarkeit</span>
          <div className="newlobby-radio-grid" role="radiogroup" aria-label="Sichtbarkeit">
            <button
              type="button"
              role="radio"
              aria-checked={visibility === "PUBLIC"}
              className={
                "newlobby-radio-card" +
                (visibility === "PUBLIC" ? " newlobby-radio-card--active" : "")
              }
              onClick={() => setVisibility("PUBLIC")}
            >
              <span className="newlobby-radio-card-title">Öffentlich</span>
              <span className="newlobby-radio-card-desc">
                Jeder kann beitreten
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={visibility === "PRIVATE"}
              className={
                "newlobby-radio-card" +
                (visibility === "PRIVATE" ? " newlobby-radio-card--active" : "")
              }
              onClick={() => setVisibility("PRIVATE")}
            >
              <span className="newlobby-radio-card-title">Privat</span>
              <span className="newlobby-radio-card-desc">Nur per Code</span>
            </button>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="newlobby-actions">
          <button
            type="submit"
            className="sbb-btn-home sbb-btn-home--primary"
            disabled={submitting}
          >
            {submitting ? "Erstellen…" : "Lobby erstellen"}
          </button>
          <button
            type="button"
            className="sbb-btn-home sbb-btn-home--secondary"
            onClick={() => router.push("/lobbies")}
            disabled={submitting}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLobbyPage;