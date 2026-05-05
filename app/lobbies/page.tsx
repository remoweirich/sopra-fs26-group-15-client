"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { Lobby } from "@/types/lobby";
import { useLobbyActions } from "@/hooks/useLobbyActions";

type PendingAction =
  | { type: "create" }
  | { type: "join"; lobbyId: number; lobbyCode: string }
  | null;

const LobbiesPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const { token } = useAuth();

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [inputCodes, setInputCodes] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Lobby[]>("/lobbies");
        setLobbies(response);
        if (response.length === 0) {
          console.log("No lobbies found.");
        }
      } catch (error) {
        console.error("Error fetching lobbies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLobbies();
  }, [apiService, token]);

  const handleCreateNewLobby = () => {
    if (token) {
      router.push("/lobbies/newlobby");
    } else {
      setPendingAction({ type: "create" });
      setAuthModalOpen(true);
    }
  };

  const handleJoinClick = (lobby: Lobby) => {
    const enteredCode = inputCodes[lobby.lobbyId] || lobby.lobbyCode;
    if (token) {
      handleJoin(lobby.lobbyId, { lobbyCode: enteredCode.toUpperCase() });
    } else {
      setPendingAction({
        type: "join",
        lobbyId: lobby.lobbyId,
        lobbyCode: enteredCode.toUpperCase(),
      });
      setAuthModalOpen(true);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setAuthModalOpen(false);
    setPendingAction(null);

    if (action.type === "create") {
      router.push("/lobbies/newlobby");
    } else if (action.type === "join") {
      try {
        await handleJoin(action.lobbyId, { lobbyCode: action.lobbyCode });
      } catch (error) {
        console.error("Guest join failed", error);
      }
    }
  };

  return (
    <div className="lobbies-page">
      {/* ── Black title header ─────────────────────────────────────────── */}
      <div className="lobbies-header">
        <div className="lobbies-header-inner">
          <div>
            <span className="eyebrow eyebrow--red">Abfahrt / Departures</span>
            <h1 className="lobbies-header-title">Offene Lobbies</h1>
          </div>
          <button
            className="sbb-btn-home sbb-btn-home--primary sbb-btn-home--small"
            onClick={handleCreateNewLobby}
          >
            + Neu
          </button>
        </div>
      </div>

      {/* ── Column header strip ────────────────────────────────────────── */}
      <div className="lobbies-table-head">
        <div className="lobbies-table-head-inner">
          <div className="lobbies-grid">
            <div className="lobbies-col-label">ID</div>
            <div className="lobbies-col-label">NAME</div>
            <div className="lobbies-col-label">SPIELER</div>
            <div className="lobbies-col-label hide-tab">RUNDEN</div>
            <div className="lobbies-col-label hide-mob">STATUS</div>
            <div />
          </div>
        </div>
      </div>

      {/* ── Rows ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="lobbies-state">Lade Lobbies…</div>
      ) : lobbies.length === 0 ? (
        <div className="lobbies-state">Keine Lobbies verfügbar</div>
      ) : (
        lobbies.map((lobby, i) => {
          const isWaiting = lobby.lobbyState === "WAITING";
          const isPrivate = lobby.visibility === "PRIVATE";
          const codeInput = inputCodes[lobby.lobbyId] || "";
          const canJoin =
            isWaiting && (!isPrivate || codeInput.trim().length > 0);

          return (
            <div
              key={lobby.lobbyId}
              className={
                "lobbies-row" +
                (i % 2 === 1 ? " lobbies-row--alt" : "") +
                (!isWaiting ? " lobbies-row--ingame" : "")
              }
            >
              <div className="lobbies-row-inner">
                <div className="lobbies-grid">
                  {/* ID badge — show lobbyCode for public, lock icon for private */}
                  <div className="lobbies-id">
                    {isPrivate ? "🔒" : lobby.lobbyCode || lobby.lobbyId}
                  </div>

                  {/* Name + admin */}
                  <div className="lobbies-name-cell">
                    <div className="lobbies-name">
                      <span
                        className={
                          "lobbies-status-dot " +
                          (isWaiting
                            ? "lobbies-status-dot--open"
                            : "lobbies-status-dot--running")
                        }
                        aria-hidden="true"
                      />
                      {lobby.lobbyName}
                    </div>
                    <div className="lobbies-by">
                      Admin #{lobby.adminId}
                    </div>
                  </div>

                  {/* Players count — OR private code input */}
                  <div>
                    {isPrivate && isWaiting ? (
                      <input
                        className="lobbies-code-input"
                        placeholder="CODE"
                        value={codeInput}
                        onChange={(e) =>
                          setInputCodes({
                            ...inputCodes,
                            [lobby.lobbyId]: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={8}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    ) : (
                      <div className="lobbies-players">
                        👥 {lobby.size}
                      </div>
                    )}
                  </div>

                  {/* Rounds — desktop only */}
                  <div className="lobbies-rounds hide-tab">
                    {(lobby.maxRounds ?? 0)}×
                  </div>

                  {/* Status text — desktop & tablet only */}
                  <div
                    className={
                      "lobbies-status hide-mob " +
                      (isWaiting
                        ? "lobbies-status--open"
                        : "lobbies-status--running")
                    }
                  >
                    {isWaiting ? "OFFEN" : "LÄUFT"}
                  </div>

                  {/* Join button */}
                  <div className="lobbies-join-cell">
                    <button
                      className={
                        "sbb-btn-home sbb-btn-home--small " +
                        (canJoin
                          ? "sbb-btn-home--primary"
                          : "sbb-btn-home--secondary")
                      }
                      disabled={!canJoin}
                      onClick={() => handleJoinClick(lobby)}
                      title={
                        !isWaiting
                          ? "Spiel hat bereits begonnen"
                          : isPrivate && !codeInput.trim()
                          ? "Code eingeben"
                          : ""
                      }
                    >
                      {isWaiting ? "Beitreten" : "Läuft"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* ── Auth-gate modal ─────────────────────────────────────────────── */}
      {authModalOpen && (
        <div
          className="auth-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthModalOpen(false);
          }}
        >
          <div className="auth-modal">
            <span className="eyebrow eyebrow--red">Vor dem Start</span>
            <h2 className="auth-title">Wie willst du spielen?</h2>
            <p className="auth-subtitle">
              Logg dich ein für Statistiken &amp; Rangliste — oder spring direkt
              als Gast rein. Als Gast werden deine Ergebnisse nicht gespeichert.
            </p>
            <div className="auth-modal-actions">
              <button
                className="sbb-btn-home sbb-btn-home--primary"
                onClick={() => {
                  setAuthModalOpen(false);
                  router.push("/login");
                }}
              >
                Einloggen
              </button>
              <button
                className="sbb-btn-home sbb-btn-home--secondary"
                onClick={() => {
                  setAuthModalOpen(false);
                  router.push("/register");
                }}
              >
                Konto erstellen
              </button>
              <button
                className="auth-modal-guest-btn"
                onClick={handleContinueAsGuest}
              >
                Als Gast weiterspielen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbiesPage;