"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Lobby, LobbyAccessDTO, LobbyCodeDTO } from "@/types/lobby";
import { Button, Spin, Modal, Tooltip } from "antd";
import { UserAuthDTO, RegisterPostDTO } from "@/types/user";
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

  const [loading, setLoading] = useState(true);
  const [emptyLobbyList, setEmptyLobbyList] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean>(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const { set: setLobbyCode } = useLocalStorage<string>("lobbyCode", "");


  useEffect(() => {

    const fetchLobbies = async () => {
      const lobby1: Lobby = {
        lobbyId: 1,
        lobbyName: "Lobby 1",
        lobbyCode: "ABC123",
        adminId: 123,
        rounds: 3,
        visibility: "PRIVATE",
        lobbyState: "IN_GAME",
        currentRound: 0,
        scores: [1, 2, 3],
        size: 5
      };
      const lobby2: Lobby = {
        lobbyId: 2,
        lobbyName: "Lobby 2",
        lobbyCode: "ABC123",
        adminId: 123,
        rounds: 3,
        visibility: "PRIVATE",
        lobbyState: "WAITING",
        currentRound: 0,
        scores: [1, 2, 3],
        size: 5
      };

      try {
        const response = await apiService.get<Lobby[]>("/lobbies");
        const combindesdLobbies = [...response, lobby1, lobby2];
        //setLobbies(combindesdLobbies); // Only for testing - replace with response when backend is ready
        setLobbies(response);

        setLoading(false);
        console.log("Fetched lobbies:", response.length);
        if (response.length === 0) {
          console.log("No lobbies found.");
          setEmptyLobbyList(true);
        }
      }
      catch (error) {

        console.error("Error fetching lobbies:", error);
      }
    };

    fetchLobbies();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    setHasCredentials(!!token && !!userId);

  }, []);


  const handleCreateNewLobby = () => {
    if (hasCredentials) {
      router.push("/lobbies/newlobby");
    } else {
      setPendingAction({
        type: "create",
      });
      setIsAuthModalVisible(true);
    }
  };

  const handleJoinClick = (lobby: Lobby) => {
    if (hasCredentials) {
      handleJoin(lobby.lobbyId, { lobbyCode: lobby.lobbyCode });
    } else {
      setPendingAction({
        type: "join",
        lobbyId: lobby.lobbyId,
        lobbyCode: lobby.lobbyCode,
      });
      setIsAuthModalVisible(true);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "create") {

      router.push("/lobbies/newlobby");

    } else if (pendingAction.type === "join") {

      await handleJoin(
        pendingAction.lobbyId, { lobbyCode: pendingAction.lobbyCode }
      );
    }

    setIsAuthModalVisible(false);
    setPendingAction(null);
  };

  const createGuestCredentials = () => {
    const values: RegisterPostDTO = {
      username: "",
      email: "",
      password: "",
      isGuest: true,
      userBio: ""
    };

    return values;
  }



  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-root page-content card--wide">

      {/* Header row */}
      <div className="lobby-page-header">
        <div>
          <h1 className="lobby-page-title">
            Lobbies
          </h1>
          <p className="lobby-page-subtitle">Join a game or create your own.</p>
        </div>

        <Button
          type="primary"
          onClick={handleCreateNewLobby}
        >
          + New Lobby
        </Button>
      </div>

      {/* Lobby list */}
      {loading ? (
        <Spin />
      ) : emptyLobbyList ? (
        <div className="lobby-list">
          <p>No lobbies available.</p>
        </div>
      ) : (
        <div className="lobby-list">
          {lobbies.map((lobby) => (
            <div key={lobby.lobbyId} className="lobby-row">
              <div className="lobby-row-left">
                <div className={`lobby-row-status-dot lobby-row-status-dot--${lobby.lobbyState === "WAITING" ? "open" : "ingame"}`} />
                <div className="lobby-row-info">
                  <div className="lobby-row-name">{lobby.lobbyName}</div>
                  <div className="lobby-row-meta">
                    Host: {lobby.adminId} | Rounds: {lobby.rounds} | Visibility: {lobby.visibility}
                  </div>
                </div>
              </div>
              <div className="lobby-row-right">
                <div className="lobby-row-players">
                  {lobby.size} player{lobby.size !== 1 && "s"}
                </div>
                <Tooltip title={lobby.lobbyState !== "WAITING" ? "Game already started" : ""}>
                  <Button
                    type="primary"
                    onClick={() => handleJoinClick(lobby)}
                    disabled={lobby.lobbyState !== "WAITING"}
                  >
                    Join
                  </Button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        title="Continue as Guest?"
        open={isAuthModalVisible}
        onCancel={() => setIsAuthModalVisible(false)}
        footer={[
          // Guest Button (left-aligned or secondary style)
          <Button key="guest" onClick={handleContinueAsGuest}>
            Continue as Guest
          </Button>,

          // Register Button
          <Button key="register"
            type="primary"
            onClick={() => router.push("/register")}>
            Register
          </Button>,

          // Login Button (Primary action)
          <Button
            key="login"
            type="primary"
            onClick={() => router.push("/login")}
          >
            Login
          </Button>,
        ]}
      >
        <p>
          You can log in or register to save your data. Feel free to continue as a guest,
          but you won&apos;t get your glorious stats saved!
        </p>
      </Modal>
    </div>
  );
};

export default LobbiesPage;