"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
// import useLocalStorage from "@/hooks/useLocalStorage";
import { Lobby, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { useWebSocket } from "@/context/WebSocketContext";
import { Spin } from "antd";
// import { UserAuthDTO, RegisterPostDTO } from "@/types/user";
import { useLobbyActions } from "@/hooks/useLobbyActions";


type PendingAction =
  | { type: "create" }
  | { type: "join"; lobbyId: number; lobbyCode: string; }
  | null;


const LobbiesPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { handleJoin } = useLobbyActions();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { user: currentUser, token, login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const [inputCodes, setInputCodes] = useState<{ [key: number]: string }>({});
  const [joinError, setJoinError] = useState<string>("");

  // const { set: setLobbyCode } = useLocalStorage<string>("lobbyCode", "");


  useEffect(() => {

    const fetchLobbies = async () => {
      // const lobby1: Lobby = {
      //   lobbyId: 1,
      //   lobbyName: "Lobby 1",
      //   lobbyCode: "ABC123",
      //   adminId: 123,
      //   rounds: 3,
      //   visibility: "PRIVATE",
      //   lobbyState: "IN_GAME",
      //   currentRound: 0,
      //   scores: [1, 2, 3],
      //   size: 5
      // };
      // const lobby2: Lobby = {
      //   lobbyId: 2,
      //   lobbyName: "Lobby 2",
      //   lobbyCode: "ABC123",
      //   adminId: 123,
      //   rounds: 3,
      //   visibility: "PRIVATE",
      //   lobbyState: "WAITING",
      //   currentRound: 0,
      //   scores: [1, 2, 3],
      //   size: 5
      // };

      try {
        setLoading(true);
        const response = await apiService.get<Lobby[]>("/lobbies");
        // const combindesdLobbies = [...response, lobby1, lobby2];
        //setLobbies(combindesdLobbies); // Only for testing - replace with response when backend is ready
        setLobbies(response);
        console.log(response); //to be removed
        console.log("Fetched lobbies:", response.length);
        if (response.length === 0) {
          console.log("No lobbies found.");
        }
      }
      catch (error) {

        console.error("Error fetching lobbies:", error);
      }
      finally {
        setLoading(false);
      }
    };

    fetchLobbies();

    // const token = localStorage.getItem("token");
    // const userId = localStorage.getItem("userId");

    // setHasCredentials(!!token && !!userId);

  }, [apiService]);

  useEffect(() => {
    if (!isAuthModalVisible) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAuthModalVisible(false);
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isAuthModalVisible]);


  const handleCreateNewLobby = () => {
    if (token) {
      router.push("/lobbies/newlobby");
    } else {
      setPendingAction({
        type: "create",
      });
      setIsAuthModalVisible(true);
    }
  };

  const handleJoinClick = async (lobby: Lobby) => {
    setJoinError("");
    const enteredCode = inputCodes[lobby.lobbyId] || lobby.lobbyCode;
    if (token) {
      try {
        await handleJoin(lobby.lobbyId, { lobbyCode: enteredCode.toUpperCase() });
      } catch (error: any) {
        if (error?.status === 409) {
          setJoinError("Lobby ist voll");
        } else if (error?.status === 404) {
          setJoinError("Lobby nicht gefunden");
        } else if (error?.status === 403) {
          setJoinError("Falscher Lobby-Code");
        }
        else {
          setJoinError("Beitreten fehlgeschlagen. Bitte erneut versuchen.");
        }
      }
    } else {
      setPendingAction({
        type: "join",
        lobbyId: lobby.lobbyId,
        lobbyCode: enteredCode,
      });
      setIsAuthModalVisible(true);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!pendingAction) return;
    const action = pendingAction;

    setIsAuthModalVisible(false);
    setPendingAction(null);

    if (action.type === "create") {
      router.push("/lobbies/newlobby");
    } else if (action.type === "join") {
      setJoinError("");
      try {
        await handleJoin(
          action.lobbyId, { lobbyCode: action.lobbyCode }
        );
      } catch (error: any) {
        if (error?.status === 409) {
          setJoinError("Lobby ist voll");
        } else if (error?.status === 404) {
          setJoinError("Lobby nicht gefunden");
        }
        else if (error?.status === 403) {
          setJoinError("Falscher Lobby-Code");
        }
        else {
          setJoinError("Beitreten fehlgeschlagen. Bitte erneut versuchen.");
        }
      }
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="gs-lobbies-root">

      {/* Black header */}
      <header className="gs-lobbies-header">
        <div className="gs-lobbies-header-inner">
          <div className="gs-lobbies-header-text">
            <span className="gs-lobbies-eyebrow">ABFAHRT / DEPARTURES</span>
            <h1 className="gs-lobbies-title">Offene Lobbies</h1>
          </div>
          <button
            type="button"
            className="gs-btn gs-btn--primary gs-btn--sm"
            onClick={handleCreateNewLobby}
          >
            + Neu
          </button>
        </div>
      </header>

      {/* Charcoal column-headers row */}
      <div className="gs-lobbies-thead" role="row">
        <div className="gs-lobbies-thead-inner gs-lobbies-grid">
          <div className="gs-lobbies-th">ID</div>
          <div className="gs-lobbies-th">Name</div>
          <div className="gs-lobbies-th gs-lobbies-hide-sm">Spieler</div>
          <div className="gs-lobbies-th gs-lobbies-hide-md">Runden</div>
          <div className="gs-lobbies-th">Status</div>
          <div aria-hidden="true" />
        </div>
      </div>

      {/* Error banner */}
      {joinError && (
        <div className="gs-lobbies-error" role="alert">
          {joinError}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="gs-lobbies-state">
          <Spin />
        </div>
      ) : lobbies.length === 0 ? (
        <div className="gs-lobbies-state gs-lobbies-empty">
          Keine offenen Lobbies.
        </div>
      ) : (
        <div className="gs-lobbies-body">
          {lobbies.map((lobby, i) => {
            const isFull = lobby.currentPlayers >= lobby.maxPlayers;
            const isLive = lobby.lobbyState !== "WAITING";
            const isPrivate = lobby.visibility === "PRIVATE";
            const enteredCode = inputCodes[lobby.lobbyId] || "";
            const buttonDisabled =
              isFull || isLive || (isPrivate && !enteredCode);
            const buttonLabel = isFull ? "Voll" : isLive ? "Läuft" : "Beitreten";
            const buttonVariant = isFull || isLive ? "secondary" : "primary";

            return (
              <div
                key={lobby.lobbyId}
                className={
                  "gs-lobby-row" +
                  (i % 2 === 1 ? " gs-lobby-row--alt" : "") +
                  (isLive ? " gs-lobby-row--dim" : "")
                }
                role="row"
              >
                <div className="gs-lobbies-grid">
                  {/* ID badge */}
                  <div className="gs-lobby-id" aria-label="Lobby code">
                    {lobby.lobbyCode}
                  </div>

                  {/* Name + meta + (private code input) */}
                  <div className="gs-lobby-info">
                    <div className="gs-lobby-name">
                      <span className="gs-lobby-vis-icon" aria-hidden="true">
                        {isPrivate ? "🔒" : "🌍"}
                      </span>
                      <span className="gs-lobby-name-text">{lobby.lobbyName}</span>
                    </div>
                    <div className="gs-lobby-meta">
                      {isPrivate ? "Privat" : "Öffentlich"}
                    </div>
                    {isPrivate && !isLive && !isFull && (
                      <input
                        id={`lobby-code-${lobby.lobbyId}`}
                        className="gs-lobby-code-input"
                        placeholder="Code"
                        maxLength={6}
                        value={enteredCode}
                        onChange={(e) =>
                          setInputCodes({
                            ...inputCodes,
                            [lobby.lobbyId]: e.target.value
                              .toUpperCase()
                              .slice(0, 6),
                          })
                        }
                        aria-label={`Code für Lobby ${lobby.lobbyName}`}
                      />
                    )}
                  </div>

                  {/* Player squares */}
                  <div className="gs-lobby-players gs-lobbies-hide-sm">
                    <div className="gs-lobby-pips" aria-hidden="true">
                      {Array.from({ length: lobby.maxPlayers }).map((_, j) => (
                        <span
                          key={j}
                          className={
                            "gs-lobby-pip" +
                            (j < lobby.currentPlayers
                              ? " gs-lobby-pip--filled"
                              : "")
                          }
                        />
                      ))}
                    </div>
                    <span className="gs-lobby-players-count">
                      {lobby.currentPlayers}/{lobby.maxPlayers}
                    </span>
                  </div>

                  {/* Rounds */}
                  <div className="gs-lobby-rounds gs-lobbies-hide-md">
                    {lobby.maxRounds || 0}×
                  </div>

                  {/* Status */}
                  <div
                    className={
                      "gs-lobby-status " +
                      (isLive ? "gs-lobby-status--live" : "gs-lobby-status--open")
                    }
                  >
                    {isLive ? "Läuft" : "Offen"}
                  </div>

                  {/* Join button */}
                  <button
                    type="button"
                    className={`gs-btn gs-btn--${buttonVariant} gs-btn--sm gs-lobby-join`}
                    onClick={() => handleJoinClick(lobby)}
                    disabled={buttonDisabled}
                  >
                    {buttonLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auth gate modal — custom, matches prototype design */}
      {isAuthModalVisible && (
        <div
          className="gs-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAuthModalVisible(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="gs-modal-card">
            <span className="gs-modal-eyebrow">Vor dem Start</span>
            <h2 id="auth-modal-title" className="gs-modal-title">
              Wie willst du spielen?
            </h2>
            <p className="gs-modal-body">
              Logg dich ein für Statistiken &amp; Rangliste — oder spring direkt
              als Gast rein.
            </p>
            <div className="gs-modal-actions">
              <button
                type="button"
                className="gs-btn gs-btn--primary gs-modal-btn"
                onClick={() => {
                  setIsAuthModalVisible(false);
                  router.push("/login");
                }}
              >
                Einloggen
              </button>
              <button
                type="button"
                className="gs-btn gs-btn--secondary gs-modal-btn"
                onClick={() => {
                  setIsAuthModalVisible(false);
                  router.push("/register");
                }}
              >
                Konto erstellen
              </button>
              <button
                type="button"
                className="gs-modal-ghost"
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