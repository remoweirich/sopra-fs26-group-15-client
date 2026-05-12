"use client";

/**
 * User Profile Page — route: /users/[id]
 *
 * Design: GuesSBB v3 (dark hero · 3 quick-stats · sticky tabs · sections).
 *   Tokens : --gs-* in globals.css :root
 *   Classes: .profile-* (v3 block in globals.css)
 *
 * Two profile states:
 *   1. Guest user (own profile, MyUserDTO.isGuest === true)
 *      – role badge "Gast" in hero
 *      – guard banner inside Übersicht
 *      – Friends tab hidden
 *      – Edit modal: only username + bio (with "register for password protection" CTA)
 *   2. Registered user
 *      – role badge "Spieler"
 *      – Friends tab visible with "Freunde hinzufügen" → /leaderboard
 *      – Edit modal: username + bio + new password (changing password → logout)
 *
 * Logic preserved:
 *   - apiService.get(`/users/${profileId}`)
 *   - apiService.put(`/users/${profileId}`, …, { headers: { token } })
 *   - login(token, profileId) re-trigger after username change
 *   - logout() trigger after password change (auth context redirects to /login)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App } from "antd";
import { UserPlus } from "lucide-react";

import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { MyUserDTO, UserDTO } from "@/types/user";

type Tab = "uebersicht" | "spiele" | "erfolge" | "freunde";

/* ── Placeholder data (UI only; replace with API data later) ────────── */
const DUMMY_GAMES = [
  { name: "Schnellzug-Runde", date: "06. Mai", rounds: 3, players: 2, score: 1470, medal: "🥇", won: true },
  { name: "Nostalgie-Runde", date: "22. Apr.", rounds: 5, players: 6, score: 3676, medal: "🥇", won: true },
  { name: "After-Work-Trip", date: "21. Apr.", rounds: 5, players: 2, score: 4150, medal: "🥈", won: false },
];

const DUMMY_ACHIEVEMENTS = [
  { icon: "🚂", name: "Erste Fahrt", current: 1, total: 1 },
  { icon: "🏆", name: "Erster Sieg", current: 1, total: 1 },
  { icon: "🎯", name: "Veteran I", current: 10, total: 10 },
  { icon: "📍", name: "100 Spiele", current: 36, total: 100 },
  { icon: "💎", name: "Perfekte Runde", current: 0, total: 1 },
];

const BIO_MAX = 200;

/* ── Helpers ─────────────────────────────────────────────────────────── */
const formatNumber = (n: number): string =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’"); // Swiss apostrophe

const initialOf = (name?: string) =>
  name && name.length > 0 ? name[0].toUpperCase() : "?";

/* ════════════════════════════════════════════════════════════════════ */
const Profile: React.FC = () => {
  const router = useRouter();
  const profileId = Number(useParams().id);
  const apiService = useApi();
  const { message } = App.useApp();
  const { user: currentUser, token, login, logout, isLoading } = useAuth();

  const [profileData, setProfileData] = useState<MyUserDTO | UserDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("uebersicht");

  const isOwnProfile = currentUser?.userId === profileId;

  /* ── Load profile ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        const data = await apiService.get<MyUserDTO | UserDTO>(
          `/users/${profileId}`,
          { headers: { token } }
        );
        setProfileData(data);
      } catch {
        router.push("/lobbies");
      }
    };

    loadProfile();
  }, [profileId, token, router, apiService]);

  /* ── Derived ──────────────────────────────────────────────────────── */
  // MyUserDTO is what the API returns for OWN profile. UserDTO (foreign
  // profile) lacks `isGuest`, `email`, and `isOnline`, so any of these
  // keys present → it's MyUserDTO. We can't rely on `email` alone:
  // guest accounts often come back with empty/missing email.
  const isMyProfileData = (
    d: MyUserDTO | UserDTO | null
  ): d is MyUserDTO =>
    !!d && ("isGuest" in d || "email" in d || "isOnline" in d);

  // Guest detection — uses three signals so a guest is reliably identified
  // even when the API's isGuest flag is missing or stale:
  //   1) explicit `isGuest === true` from the API
  //   2) empty/missing `email` (guests created via the lobby flow have none)
  //   3) auto-generated guest username pattern: `guest_<hex>`
  //      (fallback for backend bugs — won't match self-chosen usernames)
  const isGuest = useMemo<boolean>(() => {
    if (!profileData) return false;
    const my = profileData as Partial<MyUserDTO>;

    // 1) Explicit flag
    if (my.isGuest === true) return true;

    // 2) Empty email (own-profile data only — UserDTO has no email)
    if ("email" in profileData) {
      const e = my.email;
      if (typeof e !== "string" || e.trim() === "") return true;
    }

    // 3) Auto-generated guest username (e.g. "guest_f655bd5f")
    const name = profileData.username ?? "";
    if (/^guest_[a-f0-9]+$/i.test(name)) return true;

    return false;
  }, [profileData]);

  const friends = profileData?.friends ?? [];

  const scoreboard = profileData?.userScoreboard;
  const totalPoints = scoreboard?.totalPoints ?? 0;
  const playedGames = scoreboard?.playedGames ?? 0;
  const playedRounds = scoreboard?.playedRounds ?? 0;
  const bestRoundPoints = scoreboard?.bestRoundPoints ?? 0;
  const precision = scoreboard?.guessingPrecision ?? 0;

  const winRateLabel = "—"; // Not yet exposed by API
  const avgPointsPerGame = useMemo(
    () => (playedGames > 0 ? Math.round(totalPoints / playedGames) : 0),
    [totalPoints, playedGames]
  );

  const creationDate = useMemo(() => {
    if (!profileData?.creationDate) return "";
    return new Date(profileData.creationDate).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [profileData]);

  /* ── Lock background scroll while modal is open ───────────────────── */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("profile-edit-locked", editing);
    return () => document.body.classList.remove("profile-edit-locked");
  }, [editing]);

  /* ── Edit handler called by modal ─────────────────────────────────── */
  const handleSaveProfile = async (values: {
    username: string;
    userBio: string;
    password: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!token || !profileData) return { ok: false, error: "Nicht eingeloggt." };

    const passwordChanged = values.password.trim().length > 0;

    try {
      const payload: Record<string, string> = {
        username: values.username.trim(),
        userBio: values.userBio.trim(),
        token,
      };
      if (passwordChanged) payload.password = values.password;

      await apiService.put(`/users/${profileId}`, payload, {
        headers: { token },
      });

      // Optimistically update local state
      const updated = {
        ...(profileData as MyUserDTO),
        username: values.username.trim(),
        userBio: values.userBio.trim(),
      };
      setProfileData(updated);
      setEditing(false);

      // Password change → log out and force re-login
      if (passwordChanged && isOwnProfile) {
        message.success("Passwort geändert — bitte erneut einloggen.");
        // Defer logout so the toast can render before the redirect
        setTimeout(() => logout(), 250);
        return { ok: true };
      }

      // Username changed → refresh auth context (so navbar etc. update)
      if (isOwnProfile && values.username !== profileData.username) {
        await login(token, profileId);
      }

      message.success("Profil aktualisiert!");
      return { ok: true };
    } catch (e: unknown) {
      const err = e as { status?: number };
      const msg =
        err?.status === 400
          ? "Username bereits vergeben."
          : "Update fehlgeschlagen.";
      return { ok: false, error: msg };
    }
  };

  /* ── Render guards ────────────────────────────────────────────────── */
  if (isLoading || !profileData) {
    return (
      <div className="profile-page-root">
        <div className="profile-shell" style={{ padding: "60px 28px" }}>
          <div className="profile-empty-card">Loading profile…</div>
        </div>
      </div>
    );
  }

  const showFriendsTab = !isGuest;

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="profile-page-root">
      {/* ─────────────── HERO ─────────────── */}
      <header className="profile-hero">
        <div className="profile-shell profile-hero-inner">
          <div className="profile-hero-avatar">
            {initialOf(profileData.username)}
            {isMyProfileData(profileData) && profileData.isOnline && (
              <span className="profile-hero-online-dot" aria-hidden="true" />
            )}
          </div>

          <div className="profile-hero-info">
            <div className="profile-hero-row">
              <h1 className="profile-hero-name">{profileData.username}</h1>
              <span
                className={
                  "profile-role-badge " +
                  (isGuest
                    ? "profile-role-badge--guest"
                    : "profile-role-badge--user")
                }
              >
                {isGuest ? "Gast" : "Spieler"}
              </span>
            </div>
            <div className="profile-hero-tagline">
              {isGuest
                ? "Temporäres Profil"
                : creationDate
                  ? `Mitglied seit ${creationDate}`
                  : "Registrierter Spieler"}
            </div>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              className="profile-hero-edit-btn"
              onClick={() => setEditing(true)}
            >
              ✏ Bearbeiten
            </button>
          )}
        </div>

        {profileData.userBio ? (
          <div className="profile-shell">
            <p className="profile-hero-bio">{profileData.userBio}</p>
          </div>
        ) : isGuest ? (
          <div className="profile-shell">
            <p className="profile-hero-bio">
              Temporäres Gast-Profil. Registriere dich für Weltrang, Freunde
              und persistente Stats.
            </p>
          </div>
        ) : null}
      </header>

      {/* ─────────────── QUICK STATS ─────────────── */}
      <div className="profile-shell">
        <div className="profile-quickstats">
          <div className="profile-quickstat profile-quickstat--red">
            <span className="profile-quickstat-icon">🎯</span>
            <span className="profile-quickstat-value">
              {formatNumber(totalPoints)}
            </span>
            <span className="profile-quickstat-label">Gesamtpunkte</span>
          </div>
          <div className="profile-quickstat profile-quickstat--dark">
            <span className="profile-quickstat-icon">🚂</span>
            <span className="profile-quickstat-value">{playedGames}</span>
            <span className="profile-quickstat-label">Spiele</span>
          </div>
          <div className="profile-quickstat profile-quickstat--green">
            <span className="profile-quickstat-icon">%</span>
            <span className="profile-quickstat-value">{winRateLabel}</span>
            <span className="profile-quickstat-label">Win-Rate</span>
          </div>
        </div>
      </div>

      {/* ─────────────── STICKY TABS ─────────────── */}
      <nav className="profile-tabs" aria-label="Profile sections">
        <div className="profile-shell profile-tabs-inner" role="tablist">
          <ProfileTab
            tab="uebersicht"
            activeTab={activeTab}
            onSelect={setActiveTab}
            icon="📊"
            label="Übersicht"
          />
          <ProfileTab
            tab="spiele"
            activeTab={activeTab}
            onSelect={setActiveTab}
            icon="🎮"
            label="Spiele"
            count={playedGames}
          />
          <ProfileTab
            tab="erfolge"
            activeTab={activeTab}
            onSelect={setActiveTab}
            icon="🏆"
            label="Erfolge"
            count={`${DUMMY_ACHIEVEMENTS.filter(a => a.current >= a.total).length}/${DUMMY_ACHIEVEMENTS.length}`}
          />
          {showFriendsTab && (
            <ProfileTab
              tab="freunde"
              activeTab={activeTab}
              onSelect={setActiveTab}
              icon="👥"
              label="Freunde"
              count={friends.length}
            />
          )}
        </div>
      </nav>

      {/* ─────────────── SECTION CONTENT ─────────────── */}
      <div className="profile-shell">
        <div className="profile-tab-content">

          {activeTab === "uebersicht" && (
            <>
              <section className="profile-section">
                <div className="profile-section-head">
                  <h2 className="profile-section-title">Statistik im Detail</h2>
                </div>
                <div className="profile-detail-grid">
                  <DetailCell icon="📊" value={formatNumber(avgPointsPerGame)} label="Ø Pkt / Spiel" />
                  <DetailCell icon="⚡" value={formatNumber(bestRoundPoints)} label="Beste Runde" />
                  <DetailCell icon="✓" value={`${(precision * 100).toFixed(0)}%`} label="Präzision" />
                  <DetailCell icon="🎯" value={String(playedRounds)} label="Runden gespielt" />
                </div>

                {isGuest && (
                  <div className="profile-guard">
                    🔒 <strong>Weltrang &amp; Freunde</strong> sind nur für
                    registrierte User verfügbar.{" "}
                    <button
                      type="button"
                      className="profile-guard-cta"
                      onClick={() => router.push("/register")}
                    >
                      Jetzt registrieren →
                    </button>
                  </div>
                )}
              </section>

              <section className="profile-section">
                <div className="profile-section-head">
                  <h2 className="profile-section-title">🎮 Letzte Spiele</h2>
                  {DUMMY_GAMES.length > 0 && (
                    <button
                      type="button"
                      className="profile-section-link"
                      onClick={() => setActiveTab("spiele")}
                    >
                      Alle ansehen →
                    </button>
                  )}
                </div>
                {DUMMY_GAMES.length === 0 ? (
                  <div className="profile-empty-card">Noch keine Spiele.</div>
                ) : (
                  <div className="profile-game-grid">
                    {DUMMY_GAMES.slice(0, 3).map((g, i) => (
                      <GameCard key={i} game={g} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "spiele" && (
            <section className="profile-section">
              <div className="profile-section-head">
                <h2 className="profile-section-title">🎮 Alle Spiele</h2>
              </div>
              {DUMMY_GAMES.length === 0 ? (
                <div className="profile-empty-card">Noch keine Spiele.</div>
              ) : (
                <div className="profile-game-grid">
                  {DUMMY_GAMES.map((g, i) => (
                    <GameCard key={i} game={g} />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "erfolge" && (
            <section className="profile-section">
              <div className="profile-section-head">
                <h2 className="profile-section-title">🏆 Erfolge</h2>
              </div>
              <div className="profile-achievements-grid">
                {DUMMY_ACHIEVEMENTS.map((a, i) => {
                  const done = a.current >= a.total;
                  const pct = Math.min(100, (a.current / a.total) * 100);
                  return (
                    <div
                      key={i}
                      className={
                        "profile-achievement-card" +
                        (done ? "" : " profile-achievement-card--locked")
                      }
                    >
                      <div className="profile-achievement-icon">{a.icon}</div>
                      <div className="profile-achievement-body">
                        <div className="profile-achievement-name">
                          {a.name}
                          {done && (
                            <span className="profile-achievement-check">✓</span>
                          )}
                        </div>
                        <div className="profile-achievement-bar">
                          <div
                            className="profile-achievement-progress"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="profile-achievement-meta">
                          {a.current} / {a.total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "freunde" && showFriendsTab && (
            <section className="profile-section">
              <div className="profile-section-head">
                <h2 className="profile-section-title">
                  👥 Freunde ({friends.length})
                </h2>
              </div>

              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-friends-add-card"
                  onClick={() => router.push("/leaderboard")}
                  style={{ marginBottom: 12 }}
                >
                  <span className="profile-friends-add-icon">
                    <UserPlus size={18} strokeWidth={2.2} />
                  </span>
                  <span className="profile-friends-add-text">
                    <span className="profile-friends-add-title">
                      Freunde hinzufügen
                    </span>
                    <span className="profile-friends-add-sub">
                      Suche Spieler in der Rangliste
                    </span>
                  </span>
                  <span className="profile-friends-add-arrow">→</span>
                </button>
              )}

              {friends.length === 0 ? (
                <div className="profile-empty-card">
                  {isOwnProfile
                    ? "Du hast noch keine Freunde — füge welche über die Rangliste hinzu."
                    : "Noch keine Freunde."}
                </div>
              ) : (
                <div className="profile-friends-grid">
                  {friends.map((f, i) => (
                    <div key={i} className="profile-friend-card">
                      <div className="profile-friend-avatar">
                        {initialOf(f.username)}
                      </div>
                      <div className="profile-friend-info">
                        <div className="profile-friend-name">{f.username}</div>
                        <div className="profile-friend-meta">
                          {formatNumber(f.userScoreboard?.totalPoints ?? 0)} Pkt
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {/* ─────────────── EDIT MODAL ─────────────── */}
      {editing && isOwnProfile && (
        <EditProfileModal
          isGuest={isGuest}
          initialUsername={profileData.username}
          initialBio={profileData.userBio || ""}
          onClose={() => setEditing(false)}
          onSave={handleSaveProfile}
          onGoRegister={() => router.push("/register")}
        />
      )}
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────── */
const ProfileTab: React.FC<{
  tab: Tab;
  activeTab: Tab;
  onSelect: (t: Tab) => void;
  icon: string;
  label: string;
  count?: number | string;
}> = ({ tab, activeTab, onSelect, icon, label, count }) => {
  const active = tab === activeTab;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={"profile-tab" + (active ? " profile-tab--active" : "")}
      onClick={() => onSelect(tab)}
    >
      <span className="profile-tab-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="profile-tab-count">{count}</span>
      )}
      {active && <span className="profile-tab-underline" aria-hidden="true" />}
    </button>
  );
};

const DetailCell: React.FC<{
  icon: string;
  value: string;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="profile-detail-cell">
    <div className="profile-detail-row">
      <span className="profile-detail-value">{value}</span>
      <span className="profile-detail-icon" aria-hidden="true">{icon}</span>
    </div>
    <div className="profile-detail-label">{label}</div>
  </div>
);

const GameCard: React.FC<{
  game: {
    name: string;
    date: string;
    rounds: number;
    players: number;
    score: number;
    medal: string;
    won: boolean;
  };
}> = ({ game }) => (
  <div
    className={
      "profile-game-card " +
      (game.won ? "profile-game-card--won" : "profile-game-card--lost")
    }
  >
    <div className="profile-game-row">
      <div className="profile-game-info">
        <div className="profile-game-name">{game.name}</div>
        <div className="profile-game-meta">
          {game.date} · {game.rounds} R · {game.players} Sp.
        </div>
      </div>
      <div className="profile-game-medal" aria-hidden="true">{game.medal}</div>
    </div>
    <div className="profile-game-score">
      {formatNumber(game.score)}
      <span className="profile-game-score-suffix">PKT</span>
    </div>
  </div>
);

/* ── Edit Profile Modal ──────────────────────────────────────────────
 * Native inputs (single border, no AntD nesting). Renders different
 * fields depending on `isGuest`. Closes on Esc, on backdrop click,
 * and on the X button. Disables Save while submitting.                */
const EditProfileModal: React.FC<{
  isGuest: boolean;
  initialUsername: string;
  initialBio: string;
  onClose: () => void;
  onSave: (values: {
    username: string;
    userBio: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  onGoRegister: () => void;
}> = ({ isGuest, initialUsername, initialBio, onClose, onSave, onGoRegister }) => {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitting, onClose]);

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setUsernameError(null);

    const trimmedName = username.trim();
    if (!trimmedName) {
      setUsernameError("Username ist erforderlich.");
      return;
    }
    if (bio.length > BIO_MAX) {
      setErrorMsg(`Bio darf max. ${BIO_MAX} Zeichen haben.`);
      return;
    }

    setSubmitting(true);
    const result = await onSave({
      username: trimmedName,
      userBio: bio,
      password: isGuest ? "" : password,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error);
    }
  };

  const passwordWillLogout = !isGuest && password.trim().length > 0;

  return (
    <div
      className="profile-edit-overlay"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="profile-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <div className="profile-edit-header">
          <h2 id="profile-edit-title" className="profile-edit-header-title">
            Profil bearbeiten
          </h2>
          <button
            type="button"
            className="profile-edit-close"
            aria-label="Schliessen"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-edit-body">

            {isGuest && (
              <div className="profile-edit-banner">
                ℹ Als Gast kannst du Name und Bio ändern. Für Passwort-Schutz,
                persistente Stats und Freunde:{" "}
                <button
                  type="button"
                  className="profile-edit-banner-cta"
                  onClick={onGoRegister}
                >
                  Konto erstellen →
                </button>
              </div>
            )}

            {/* Username */}
            <div className="profile-edit-field">
              <label
                className="profile-edit-field-label"
                htmlFor="profile-edit-username"
              >
                Benutzername
              </label>
              <input
                id="profile-edit-username"
                type="text"
                className={
                  "profile-edit-input" +
                  (usernameError ? " profile-edit-input--error" : "")
                }
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(null);
                }}
                maxLength={32}
                autoComplete="off"
                placeholder="Dein Username"
                disabled={submitting}
              />
              {usernameError && (
                <div className="profile-edit-error">{usernameError}</div>
              )}
            </div>

            {/* Bio */}
            <div className="profile-edit-field">
              <label
                className="profile-edit-field-label"
                htmlFor="profile-edit-bio"
              >
                Bio
              </label>
              <textarea
                id="profile-edit-bio"
                className="profile-edit-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={4}
                placeholder="Erzähle etwas über dich..."
                disabled={submitting}
              />
              <div className="profile-edit-counter">
                {bio.length}/{BIO_MAX} Zeichen
              </div>
            </div>

            {/* Password — registered users only */}
            {!isGuest && (
              <div className="profile-edit-field">
                <label
                  className="profile-edit-field-label"
                  htmlFor="profile-edit-password"
                >
                  Neues Passwort{" "}
                  <span style={{ color: "var(--gs-grey-l)", letterSpacing: "0.08em" }}>
                    (OPTIONAL)
                  </span>
                </label>
                <input
                  id="profile-edit-password"
                  type="password"
                  className="profile-edit-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Leer lassen, um nicht zu ändern"
                  disabled={submitting}
                />
                {passwordWillLogout && (
                  <div className="profile-edit-warn">
                    ⚠ Nach dem Speichern wirst du ausgeloggt und musst dich
                    erneut einloggen.
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="profile-edit-error" role="alert">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="profile-edit-footer">
            <button
              type="button"
              className="profile-edit-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="profile-edit-btn-save"
              disabled={submitting}
            >
              {submitting ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
