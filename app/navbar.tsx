"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Input } from "antd";
import { ApiService } from "./api/apiService";
import { MyUserDTO, UserDTO } from "./types/user";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// ---------------------------------------------------------------------------
// GuessSBB SVG logo mark (simplified train-pin icon)
// ---------------------------------------------------------------------------
function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#E30613" />
      <path
        d="M16 4C12.134 4 9 7.134 9 11c0 5.25 7 14 7 14s7-8.75 7-14c0-3.866-3.134-7-7-7z"
        fill="white"
      />
      <circle cx="16" cy="11" r="3" fill="#E30613" />
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


  function handleLobbySearch(e: React.KeyboardEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value.trim();
    if (e.key === "Enter" && value) {
      router.push(`/lobbies/${value}`);
    }
  }

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `navbar-link${active ? " active" : ""}`;
  }

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link href="/" className="navbar-brand">
        <LogoMark />
        <span className="navbar-brand-text">
          Gues<span>SBB</span>
        </span>
      </Link>

      {/* Primary links */}
      {!isLoading && <div className="navbar-links">
        {user && <Badge count={notificationCount} size="small" offset={[4, -2]}>
          <button className="navbar-link" aria-label="Notifications">
            <Bell size={20} /> {/* Hier wird das Icon angezeigt */}
          </button>
        </Badge>}

        <Link href="/lobbies" className={linkClass("/lobbies")}>
          Lobbies
        </Link>

        <Link href="/leaderboard" className={linkClass("/leaderboard")}>
          Leaderboard
        </Link>

        {user && (
          <Link
            href={`/users/${user.userId}`}
            className={linkClass(`/users/${user.userId}`)}
          >
            {user.username}
          </Link>
        )}

        {!user && (
          <Link href="/login" className={linkClass("/login")}>
            Login
          </Link>
        )}

        {!user && (
          <Link href="/register" className={linkClass("/register")}>
            Register
          </Link>
        )}

        {user && (
          <button
            className="navbar-link"
            onClick={logout}
            aria-label="Logout"
            title="Abmelden" // Zeigt Text an, wenn man mit der Maus drüberfährt
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }} // Optional: Styling für Ausrichtung
          >
            <LogOut size={20} />
            {/* Wenn du NUR das Icon willst, lösch das Wort "Logout" hier einfach */}
          </button>
        )}

      </div>}

      {/* Right side */}
      <div className="navbar-right">
        
        <label className="navbar-lobby-search" htmlFor="lobby-id-search">

          <input
            id="lobby-id-search"
            placeholder="Enter Lobby ID"
            onKeyDown={handleLobbySearch}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "var(--sbb-mid-gray)",
              width: "100%",
            }}
          />
        </label>
      </div>
    </nav>
  );
}