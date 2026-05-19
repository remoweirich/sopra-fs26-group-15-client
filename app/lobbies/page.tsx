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

// Lobby the user clicked "Beitreten" on, when that lobby is PRIVATE.
// Triggers the inline code-entry modal — keeps the table rows uniform
// instead of stacking an input above each private row's button.
type PrivateJoinTarget = { lobbyId: number; lobbyName: string } | null;

// Pip indicator (player slots)
const Pips = ({ n, max }: { readonly n: number; readonly max: number }) => {
  // Stable keys per slot — each "pip" position has a fixed identity within this max.
  const slots = Array.from({ length: max }, (_, i) => `slot-${max}-${i}`);
  return (
    <div className="lobby-row-pips hide-md">
      {slots.map((id, j) => (
        <span key={id} className={`lobby-pip ${j < n ? "is-on" : ""}`} />
      ))}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--grey)", marginLeft: 5 }}>
        {n}/{max}
      </span>
    </div>
  );
};

const LobbiesPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const { token } = useAuth();

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [joinError, setJoinError] = useState<string>("");
  const [privateJoin, setPrivateJoin] = useState<PrivateJoinTarget>(null);
  const [privateCode, setPrivateCode] = useState("");

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Lobby[]>("/lobbies");
        setLobbies(response);
      } catch (error) {
        console.error("Error fetching lobbies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLobbies();
  }, [apiService]);

  const handleCreateNewLobby = () => {
    if (token) {
      router.push("/lobbies/newlobby");
    } else {
      setPendingAction({ type: "create" });
      setIsAuthModalVisible(true);
    }
  };

  const joinLobby = async (lobbyId: number, lobbyCode: string) => {
    setJoinError("");
    try {
      await handleJoin(lobbyId, { lobbyCode: lobbyCode.toUpperCase() });
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      if (status === 409) setJoinError("Lobby bereits voll");
      else if (status === 404) setJoinError("Lobby nicht gefunden");
      else if (status === 403) setJoinError("Falscher Lobby-Code");
      else setJoinError("Beitritt fehlgeschlagen. Bitte erneut versuchen.");
    }
  };

  const handleJoinClick = async (lobby: Lobby) => {
    // Private lobbies need a code — open the inline modal instead of
    // stacking an input into the table row (which looked uneven).
    if (lobby.visibility === "PRIVATE") {
      setPrivateCode("");
      setJoinError("");
      setPrivateJoin({ lobbyId: lobby.lobbyId, lobbyName: lobby.lobbyName });
      return;
    }
    if (token) {
      await joinLobby(lobby.lobbyId, lobby.lobbyCode);
    } else {
      setPendingAction({ type: "join", lobbyId: lobby.lobbyId, lobbyCode: lobby.lobbyCode });
      setIsAuthModalVisible(true);
    }
  };

  const submitPrivateJoin = async () => {
    if (!privateJoin) return;
    const code = privateCode.trim();
    if (!code) {
      setJoinError("Bitte gib einen Code ein.");
      return;
    }
    const target = privateJoin;
    if (!token) {
      setPendingAction({ type: "join", lobbyId: target.lobbyId, lobbyCode: code });
      setPrivateJoin(null);
      setIsAuthModalVisible(true);
      return;
    }
    setPrivateJoin(null);
    await joinLobby(target.lobbyId, code);
  };

  const handleContinueAsGuest = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setIsAuthModalVisible(false);
    setPendingAction(null);

    if (action.type === "create") {
      router.push("/lobbies/newlobby");
    } else if (action.type === "join") {
      await joinLobby(action.lobbyId, action.lobbyCode);
    }
  };

  const fetchLobbies = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Lobby[]>("/lobbies");
      setLobbies(response);
    } catch (error) {
      console.error("Error fetching lobbies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, [apiService]);

  return (
    <div className="page-root">
      <div className="section-head">
        <div className="section-head-row">
          <div>
            <span className="label">Abfahrt / Departures</span>
            <h1>Offene Lobbies</h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="sbb-btn sbb-btn--secondary sbb-btn--sm"
              onClick={() => fetchLobbies()}
              type="button"
              aria-label="Lobbies aktualisieren"
            >
              ↻
            </button>
            <button
              className="sbb-btn sbb-btn--primary sbb-btn--sm"
              onClick={handleCreateNewLobby}
              type="button"
            >
              + Neu
            </button>
          </div>
        </div>
      </div>

      {/* Table header — stripe wrapper paints the dark band edge-to-edge
          while the grid of column labels stays centred to the shell. */}
      <div className="lobby-stripe is-head">
        <div className="lobby-table-head">
          <span>ID</span>
          <span>NAME</span>
          <span className="hide-md col-players">SPIELER</span>
          <span className="hide-md col-rounds">RUNDEN</span>
          <span>STATUS</span>
          <span />
        </div>
      </div>

      {joinError && <div className="lobby-join-error">{joinError}</div>}

      {loading ? (
        <div className="page-loading">Laden…</div>
      ) : lobbies.length === 0 ? (
        <div className="lobby-list-empty">Keine offenen Lobbies. Erstelle eine neue!</div>
      ) : (
        lobbies.map((lobby, i) => {
          const full = lobby.currentPlayers >= lobby.maxPlayers;
          const live = lobby.lobbyState !== "WAITING";
          // Alternate stripe background by index — equivalent to the
          // previous :nth-child(even) selector but explicit (the stripe
          // wrapper sits between us and the parent so the structural
          // selector wouldn't fire).
          const stripeAlt = i % 2 === 1;
          return (
            <div
              key={lobby.lobbyId}
              className={`lobby-stripe ${stripeAlt ? "is-alt" : ""}`}
            >
            <div className={`lobby-row ${live ? "lobby-row--ingame" : ""}`}>
              {/* Private lobbies don't expose their join code in the
                  public listing, so the badge would render as an empty
                  red strip. Fall back to a lock glyph so the row still
                  reads as "this is a lobby" at the same visual weight
                  as the public ones. */}
              <div
                className="lobby-row-code"
                aria-label={lobby.visibility === "PRIVATE" ? "Privater Code" : `Code ${lobby.lobbyCode}`}
              >
                {lobby.lobbyCode || "🔒"}
              </div>
              <div>
                <div className="lobby-row-name">{lobby.lobbyName}</div>
                <div className="lobby-row-meta">
                  by {lobby.host ?? lobby.adminUsername ?? "Anonymous"}
                </div>
              </div>
              <Pips n={lobby.currentPlayers} max={lobby.maxPlayers} />
              <div className="lobby-row-rounds">{lobby.maxRounds}×</div>
              <div className={`lobby-row-status ${live ? "is-live" : "is-open"}`}>
                {live ? "LÄUFT" : "OFFEN"}
              </div>
              <button
                type="button"
                className={`sbb-btn ${full || live ? "sbb-btn--secondary" : "sbb-btn--primary"} sbb-btn--sm`}
                style={{ justifySelf: "end" }}
                disabled={full || live}
                onClick={() => handleJoinClick(lobby)}
              >
                {full ? "Voll" : live ? "Läuft" : "Beitreten"}
              </button>
            </div>
            </div>
          );
        })
      )}

      {/* Private-lobby code modal */}
      {privateJoin && (
        <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Lobby-Code eingeben">
          <button
            type="button"
            onClick={() => setPrivateJoin(null)}
            aria-label="Modal schliessen"
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          />
          <div className="sbb-modal" style={{ position: "relative", zIndex: 1 }}>
            <span className="label">🔒 Private Lobby</span>
            <h2>{privateJoin.lobbyName}</h2>
            <p className="sub">Gib den Lobby-Code ein, um beizutreten.</p>
            <input
              autoFocus
              className="sbb-input"
              placeholder="A1B2"
              value={privateCode}
              onChange={(e) => setPrivateCode(e.target.value.toUpperCase().slice(0, 8))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPrivateJoin();
              }}
              style={{ letterSpacing: "0.18em", textAlign: "center", fontSize: 18 }}
            />
            <div className="sbb-modal-footer">
              <button
                type="button"
                className="sbb-btn sbb-btn--secondary sbb-btn--md"
                onClick={() => setPrivateJoin(null)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="sbb-btn sbb-btn--primary sbb-btn--md"
                disabled={!privateCode.trim()}
                onClick={submitPrivateJoin}
              >
                Beitreten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth-gate modal */}
      {isAuthModalVisible && (
        <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Wie willst du spielen?">
          <button
            type="button"
            onClick={() => setIsAuthModalVisible(false)}
            aria-label="Modal schliessen"
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          />
          <div className="sbb-modal" style={{ position: "relative", zIndex: 1 }}>
            <span className="label">Vor dem Start</span>
            <h2>Wie willst du spielen?</h2>
            <p className="sub">
              Logg dich ein für Statistiken & Rangliste — oder spring direkt als Gast rein.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="sbb-btn sbb-btn--primary sbb-btn--full"
                onClick={() => {
                  setIsAuthModalVisible(false);
                  router.push("/login");
                }}
              >
                Einloggen
              </button>
              <button
                type="button"
                className="sbb-btn sbb-btn--secondary sbb-btn--full"
                onClick={() => {
                  setIsAuthModalVisible(false);
                  router.push("/register");
                }}
              >
                Konto erstellen
              </button>
              <button
                type="button"
                onClick={handleContinueAsGuest}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--grey)",
                  background: "transparent",
                  border: "none",
                  padding: 12,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 4,
                }}
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
