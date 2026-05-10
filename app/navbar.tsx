"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Input } from "antd";
import { ApiService } from "./api/apiService";
import { MyUserDTO, UserDTO } from "./types/user";
import { Bell, LogOut, Search, Menu, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// ---------------------------------------------------------------------------
// Swiss cross logo mark — white version on red navbar background
// ---------------------------------------------------------------------------
function SBBCross({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="#FFFFFF"
      aria-hidden="true"
    >
      <rect x="7" y="0" width="8" height="22" rx="1" />
      <rect x="0" y="7" width="22" height="8" rx="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------


export default function Navbar() {

  // const [resolvedUser, setResolvedUser] = useState<{ userId: number; username: string } | null>(null);
  const [notificationCount, setNotificationCount] = useState(3); // Placeholder for notification count, replace with actual logic to fetch count
  // const [showLinks, setShowLinks] = useState(false);
  const{user,logout,isLoading} = useAuth();

  const pathname = usePathname();
  const router = useRouter();
  // const apiService = new ApiService();


//   useEffect(() => {
//     const token = JSON.parse(localStorage.getItem("token") || '""');
// const userId = JSON.parse(localStorage.getItem("userId") || "-1");
    

//     console.log("Navbar - Retrieved token from localStorage:", token);
//     console.log("Navbar - Retrieved userId from localStorage:", userId);

    

//     if (!token || userId === -1) {
//       setResolvedUser(null);
//       setShowLinks(true);
//       return;
//     }

//     const fetchAndSetUser = async () => {
//       try {
//         const userData = await apiService.get(
//           `/users/${Number(userId)}`,
//           {
//             headers: { token: token },
//           }) as MyUserDTO | UserDTO;
//         if ("email" in userData) {
//           setResolvedUser({ userId: userId, username: userData.username });
//         } else {
//           setResolvedUser(null);
//         }
//       }
//       catch (error) {
//         //console.error("Error fetching user data in Navbar:", error);
//         setResolvedUser(null);
//       }

//     };

//     fetchAndSetUser();
//     setShowLinks(true);
//   }, []);



  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("userId");

  //   setResolvedUser(null);

  //   router.push("/login");
  // };


  // ── Lobby code search (controlled input + Join button) ────────────────────
  const [lobbyCode, setLobbyCode] = useState("");

  function handleLobbyJoin() {
    const value = lobbyCode.trim();
    if (!value) return;
    router.push(`/lobbies/${value.toUpperCase()}`);
    setLobbyCode("");
    setMenuOpen(false);
  }

  function handleLobbyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLobbyJoin();
  }

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `gs-nav-link${active ? " gs-nav-link--active" : ""}`;
  }

const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Helper: route + close menu (for mobile menu links)
  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="gs-navbar">
        {/* ── Left column: brand ─────────────────────────────────────────── */}
        <Link href="/" className="gs-nav-brand">
          <SBBCross size={20} />
          <span className="gs-nav-brand-text">
            Gues<span>SBB</span>
          </span>
        </Link>

        {/* ── Center column: lobby code pill (desktop only) ──────────────── */}
        <div className="gs-nav-search-wrap">
          <div className="gs-nav-search">
            <Search size={14} className="gs-nav-search-icon" aria-hidden="true" />
            <input
              id="lobby-id-search"
              className="gs-nav-search-input"
              placeholder="LOBBY-CODE"
              value={lobbyCode}
              onChange={(e) =>
                setLobbyCode(e.target.value.toUpperCase().slice(0, 6))
              }
              onKeyDown={handleLobbyKeyDown}
              maxLength={6}
              aria-label="Lobby code"
            />
            <button
              type="button"
              className="gs-nav-search-join"
              onClick={handleLobbyJoin}
            >
              Join
            </button>
          </div>
        </div>

        {/* ── Right column: actions ──────────────────────────────────────── */}
        {!isLoading && (
          <div className="gs-nav-actions">
            {user && (
              <Badge count={notificationCount} size="small" offset={[4, -2]}>
                <button
                  className="gs-nav-icon-btn"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                </button>
              </Badge>
            )}

            <Link href="/lobbies" className={linkClass("/lobbies")}>
              Züge
            </Link>

            <Link href="/leaderboard" className={linkClass("/leaderboard")}>
              Rangliste
            </Link>

            {user ? (
              <>
                <Link
                  href={`/users/${user.userId}`}
                  className={linkClass(`/users/${user.userId}`)}
                >
                  {user.username}
                </Link>
                <button
                  className="gs-nav-logout"
                  onClick={logout}
                  aria-label="Logout"
                  title="Abmelden"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="gs-nav-login">
                  Login
                </Link>
                <Link href="/register" className="gs-nav-register">
                  Registration
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── Burger button (mobile/tablet only) ─────────────────────────── */}
        <button
          className="gs-nav-burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ── Backdrop behind drawer ─────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="gs-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Right-side drawer (mobile/tablet) ──────────────────────────── */}
      <aside
        className={`gs-drawer${menuOpen ? " gs-drawer--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        {/* Lobby code search inside drawer */}
        <div className="gs-drawer-search-wrap">
          <div className="gs-drawer-search-label">LOBBY-CODE EINGEBEN</div>
          <div className="gs-drawer-search">
            <input
              id="mobile-lobby-id-search"
              className="gs-drawer-search-input"
              placeholder="A1B2"
              value={lobbyCode}
              onChange={(e) =>
                setLobbyCode(e.target.value.toUpperCase().slice(0, 6))
              }
              onKeyDown={handleLobbyKeyDown}
              maxLength={6}
              aria-label="Lobby code"
            />
            <button
              type="button"
              className="gs-drawer-search-join"
              onClick={handleLobbyJoin}
            >
              Join
            </button>
          </div>
        </div>

        <button
          className="gs-drawer-link"
          onClick={() => go("/lobbies")}
        >
          🚂 Züge
        </button>

        <button
          className="gs-drawer-link"
          onClick={() => go("/leaderboard")}
        >
          🏆 Rangliste
        </button>

        <div className="gs-drawer-divider" />

        {!isLoading && user && (
          <>
            <button
              className="gs-drawer-link"
              onClick={() => go(`/users/${user.userId}`)}
            >
              👤 {user.username}
            </button>
            <button
              className="gs-drawer-link gs-drawer-link--muted"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              Logout
            </button>
          </>
        )}

        {!isLoading && !user && (
          <>
            <button
              className="gs-drawer-link gs-drawer-link--login"
              onClick={() => go("/login")}
            >
              Login
            </button>
            <button
              className="gs-drawer-link gs-drawer-link--register"
              onClick={() => go("/register")}
            >
              Registration
            </button>
          </>
        )}
      </aside>
    </>
  );
}