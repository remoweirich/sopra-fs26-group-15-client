"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
// import useLocalStorage from "@/hooks/useLocalStorage";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";
import { useAuth } from "@/context/AuthContext";

const NewLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const { user: currentUser, token, login } = useAuth();

  // ── Form state ────────────────────────────────────────────────────────────
  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [maxRounds, setMaxRounds] = useState(5);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState(false);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {

    // const rawToken = localStorage.getItem("token");
    // const token = rawToken ? JSON.parse(rawToken) : "";

    // const rawUserId = localStorage.getItem("userId");
    // const userId = rawUserId ? JSON.parse(rawUserId) : -1;

    if (!lobbyName.trim()) {
      setNameError(true);
      return;
    }

    setSubmitting(true);

    const payload = {
      lobbyName: lobbyName.trim(),
      maxPlayers: Number(maxPlayers),  // war size
      maxRounds: Number(maxRounds),
      visibility: visibility,
    };

    console.log(currentUser ? currentUser.userId.toString() : "-1")

    // Aufruf mit 3 Argumenten:
    const response = await apiService.post<LobbyAccessDTO>(
      "/lobbies",              // 1. Endpoint
      payload,      // 2. Data (Body) - schicke direkt das DTO
      {                        // 3. Options (Headers)
        headers: {
          token: token ? token : "",
          userId: currentUser ? currentUser.userId.toString() : "-1",
        },
      }
    );

    // localStorage.setItem("token", JSON.stringify(response.token));
    // localStorage.setItem("userId", JSON.stringify(response.userId));
    await login(response.token, response.userId);

    const lobbyCodeDTO: LobbyCodeDTO = {
      lobbyCode: response.lobbyCode
    };

    handleJoin(response.lobbyId, lobbyCodeDTO, { userId: response.userId, token: response.token });

  };

  return (
    <div className="gs-newlobby-root">
      <div className="gs-newlobby-card">
        <span className="gs-newlobby-eyebrow">Neue Lobby</span>
        <h1 className="gs-newlobby-title">Set up your game</h1>
        <p className="gs-newlobby-subtitle">Konfiguriere deine Runde.</p>

        {/* Lobby Name */}
        <div className="gs-newlobby-field">
          <label htmlFor="lobby-name-input" className="gs-newlobby-label">
            Lobby-Name
          </label>
          <input
            id="lobby-name-input"
            type="text"
            className={
              "gs-newlobby-input" +
              (nameError ? " gs-newlobby-input--error" : "")
            }
            placeholder="Züri-Express"
            maxLength={28}
            value={lobbyName}
            onChange={(e) => {
              setLobbyName(e.target.value);
              if (nameError) setNameError(false);
            }}
          />
          {nameError && (
            <span className="gs-newlobby-error">Bitte gib einen Namen ein.</span>
          )}
        </div>

        {/* Player count stepper */}
        <div className="gs-newlobby-field">
          <div className="gs-newlobby-label-row">
            <span className="gs-newlobby-label">Spieleranzahl</span>
            <span className="gs-newlobby-hint">2–12</span>
          </div>
          <div className="gs-stepper">
            <button
              type="button"
              className="gs-stepper-btn"
              onClick={() => setMaxPlayers((m) => Math.max(2, m - 1))}
              disabled={maxPlayers <= 2}
              aria-label="Spieleranzahl verringern"
            >
              −
            </button>
            <div
              className="gs-stepper-value"
              aria-live="polite"
              aria-label={`${maxPlayers} Spieler`}
            >
              {maxPlayers}
            </div>
            <button
              type="button"
              className="gs-stepper-btn"
              onClick={() => setMaxPlayers((m) => Math.min(12, m + 1))}
              disabled={maxPlayers >= 12}
              aria-label="Spieleranzahl erhöhen"
            >
              +
            </button>
          </div>
        </div>

        {/* Rounds segmented control */}
        <div className="gs-newlobby-field">
          <span className="gs-newlobby-label">Runden</span>
          <div
            className="gs-segmented"
            role="radiogroup"
            aria-label="Anzahl Runden"
          >
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className={
                  "gs-segmented-btn" +
                  (maxRounds === n ? " gs-segmented-btn--active" : "")
                }
                onClick={() => setMaxRounds(n)}
                role="radio"
                aria-checked={maxRounds === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility radio cards */}
        <div className="gs-newlobby-field">
          <span className="gs-newlobby-label">Sichtbarkeit</span>
          <div
            className="gs-radio-cards"
            role="radiogroup"
            aria-label="Sichtbarkeit"
          >
            <button
              type="button"
              className={
                "gs-radio-card" +
                (visibility === "PUBLIC" ? " gs-radio-card--active" : "")
              }
              onClick={() => setVisibility("PUBLIC")}
              role="radio"
              aria-checked={visibility === "PUBLIC"}
            >
              <div className="gs-radio-card-label">Öffentlich</div>
              <div className="gs-radio-card-desc">Jeder kann beitreten</div>
            </button>
            <button
              type="button"
              className={
                "gs-radio-card" +
                (visibility === "PRIVATE" ? " gs-radio-card--active" : "")
              }
              onClick={() => setVisibility("PRIVATE")}
              role="radio"
              aria-checked={visibility === "PRIVATE"}
            >
              <div className="gs-radio-card-label">Privat</div>
              <div className="gs-radio-card-desc">Nur per Code</div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="gs-newlobby-actions">
          <button
            type="button"
            className="gs-btn gs-btn--primary gs-newlobby-submit"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? "Wird erstellt…" : "Lobby erstellen"}
          </button>
          <button
            type="button"
            className="gs-btn gs-btn--secondary"
            onClick={() => router.push("/lobbies")}
            disabled={submitting}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLobbyPage;