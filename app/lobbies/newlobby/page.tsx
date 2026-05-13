"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { CreateLobbyPostDTO, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";
import { useAuth } from "@/context/AuthContext";

type Visibility = "PUBLIC" | "PRIVATE";

const NewLobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const { user: currentUser, token, login } = useAuth();

  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [maxRounds, setMaxRounds] = useState(5);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lobbyName.trim()) {
      setError("Bitte gib einen Lobby-Namen ein.");
      return;
    }

    const payload: CreateLobbyPostDTO = {
      lobbyName: lobbyName.trim(),
      maxPlayers,
      maxRounds,
      visibility,
    };

    setSubmitting(true);
    try {
      const response = await apiService.post<LobbyAccessDTO>(
        "/lobbies",
        payload,
        {
          headers: {
            token: token ?? "",
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
      console.error("Failed to create lobby:", err);
      setError("Lobby konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-center">
      <form className="sbb-card--form" onSubmit={handleCreate} noValidate>
        <span className="label">Neue Lobby</span>
        <h2>Set up your game</h2>
        <p className="sub">Konfiguriere deine Runde.</p>

        {error && <div className="sbb-field-error">{error}</div>}

        {/* Lobby name */}
        <div className="sbb-field">
          <div className="sbb-field-label">
            <span className="label label--grey">Lobby-Name</span>
          </div>
          <input
            className="sbb-input"
            value={lobbyName}
            onChange={(e) => setLobbyName(e.target.value.slice(0, 28))}
            placeholder="Züri-Express"
          />
        </div>

        {/* Player count stepper */}
        <div className="sbb-field">
          <div className="sbb-field-label" style={{ justifyContent: "space-between", flex: 1 }}>
            <span className="label label--grey">Spieleranzahl</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--grey-l)", letterSpacing: "0.06em" }}>
              2–12
            </span>
          </div>
          <div className="sbb-stepper">
            <button
              type="button"
              onClick={() => setMaxPlayers((m) => Math.max(2, m - 1))}
              disabled={maxPlayers <= 2}
              aria-label="weniger Spieler"
            >
              −
            </button>
            <div className="sbb-stepper-value">{maxPlayers}</div>
            <button
              type="button"
              onClick={() => setMaxPlayers((m) => Math.min(12, m + 1))}
              disabled={maxPlayers >= 12}
              aria-label="mehr Spieler"
            >
              +
            </button>
          </div>
        </div>

        {/* Rounds segmented */}
        <div className="sbb-field">
          <div className="sbb-field-label">
            <span className="label label--grey">Runden</span>
          </div>
          <div className="sbb-segmented">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className={maxRounds === n ? "is-active" : ""}
                onClick={() => setMaxRounds(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility radio cards */}
        <div className="sbb-field" style={{ marginBottom: 22 }}>
          <div className="sbb-field-label">
            <span className="label label--grey">Sichtbarkeit</span>
          </div>
          <div className="sbb-radio-cards">
            <button
              type="button"
              className={`sbb-radio-card ${visibility === "PUBLIC" ? "is-active" : ""}`}
              onClick={() => setVisibility("PUBLIC")}
            >
              <div className="sbb-radio-card-title">🌍 Öffentlich</div>
              <div className="sbb-radio-card-desc">Jeder kann beitreten</div>
            </button>
            <button
              type="button"
              className={`sbb-radio-card ${visibility === "PRIVATE" ? "is-active" : ""}`}
              onClick={() => setVisibility("PRIVATE")}
            >
              <div className="sbb-radio-card-title">🔒 Privat</div>
              <div className="sbb-radio-card-desc">Nur per Code</div>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            className="sbb-btn sbb-btn--primary sbb-btn--md"
            style={{ flex: 1 }}
            disabled={submitting}
          >
            {submitting ? "Erstelle…" : "Lobby erstellen"}
          </button>
          <button
            type="button"
            className="sbb-btn sbb-btn--secondary sbb-btn--md"
            onClick={() => router.push("/lobbies")}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLobbyPage;
