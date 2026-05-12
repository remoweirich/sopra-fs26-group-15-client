"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { MyUserDTO, UserDTO } from "@/types/user";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

type ProfileTab = "overview" | "games" | "friends" | "achievements";

// Dummy game history (no backend endpoint yet)
const DUMMY_HISTORY = [
  { name: "Pendler-Challenge", date: "10. Mär", rounds: "5R", score: 4280 },
  { name: "Mittagspause Express", date: "09. Mär", rounds: "3R", score: 2340 },
  { name: "SBB Marathon", date: "08. Mär", rounds: "10R", score: 7820 },
  { name: "Anfänger Runde", date: "07. Mär", rounds: "1R", score: 620 },
  { name: "Geheime Runde", date: "06. Mär", rounds: "5R", score: 3950 },
];

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

const ProfilePage: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const profileId = Number(useParams().id);
  const { user: currentUser, token, login, logout, isLoading } = useAuth();

  const [profileData, setProfileData] = useState<MyUserDTO | UserDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("overview");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isOwnProfile = currentUser?.userId === profileId;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiService.get<MyUserDTO | UserDTO>(
          `/users/${profileId}`,
          { headers: { token: token ?? "" } }
        );
        setProfileData(data);
      } catch (error) {
        console.error(error);
        router.push("/lobbies");
      }
    };
    loadProfile();
  }, [profileId, token, router, apiService]);

  if (isLoading || !profileData) {
    return <div className="page-loading">Lade Profil…</div>;
  }

  // Guest detection: we accept any of three signals because the server's
  // Jackson serialisation of `Boolean isGuest` can drop the field in some
  // configurations, leaving the client without an explicit flag. The
  // username + email patterns are stable fallbacks because the backend
  // generates them deterministically for guests:
  //   UserService.java line 139:  username = "guest_" + uuid8
  //   UserService.java line 142:  email    = uuid + "@guest.com"
  const profileAsAny = profileData as Partial<MyUserDTO>;
  const isGuest =
    profileAsAny.isGuest === true ||
    profileData.username?.startsWith("guest_") === true ||
    profileAsAny.email?.endsWith("@guest.com") === true;
  // Friends tab + password edit are only available to registered users.
  const showFriends = !isGuest;
  const showPasswordField = !isGuest;

  // Defensive: if the tab points at a section the guest can't access, fall
  // back to overview. Set during render is safe here because it's gated on a
  // condition that converges in one re-render.
  if (!showFriends && tab === "friends") {
    setTab("overview");
  }

  const initial = profileData.username ? profileData.username[0].toUpperCase() : "?";
  const creationDate = profileData.creationDate
    ? new Date(profileData.creationDate).toLocaleDateString("de-CH", {
        month: "long",
        year: "numeric",
      })
    : "";

  const scoreboard = profileData.userScoreboard;
  const totalPoints = scoreboard?.totalPoints ?? 0;
  const playedGames = scoreboard?.playedGames ?? 0;
  const playedRounds = scoreboard?.playedRounds ?? 0;
  const bestRound = scoreboard?.bestRoundPoints ?? 0;
  const precision = scoreboard?.guessingPrecision ?? 0;
  const avgPoints = playedGames > 0 ? Math.round(totalPoints / playedGames) : 0;

  const handleStartEdit = () => {
    setEditName(profileData.username || "");
    setEditBio(profileData.userBio || "");
    setEditPassword("");
    setEditPassword2("");
    setUpdateError(null);
    setUpdateSuccess(false);
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpdateError(null);
    setUpdateSuccess(false);

    if (!editName.trim()) {
      setUpdateError("Name darf nicht leer sein.");
      return;
    }

    // Password change is only meaningful for registered users; guests
    // never see the field. If the user typed anything, the two fields
    // must agree — otherwise the API would silently accept a typo.
    const wantsPasswordChange = showPasswordField && editPassword.length > 0;
    if (wantsPasswordChange && editPassword !== editPassword2) {
      setUpdateError("Passwörter stimmen nicht überein.");
      return;
    }

    const payload: { username: string; userBio?: string; password?: string } = {
      username: editName.trim(),
      userBio: editBio.trim(),
    };
    if (wantsPasswordChange) payload.password = editPassword;

    try {
      await apiService.put(`/users/${profileId}`, { ...payload, token }, {
        headers: { token: token ?? undefined },
      });
      setProfileData({ ...profileData, ...payload });
      setUpdateSuccess(true);

      // Password change invalidates the current session — log the user
      // out and bounce them to /login so they sign in with the new one.
      if (wantsPasswordChange && isOwnProfile) {
        setTimeout(() => logout(), 800);
        return;
      }

      if (isOwnProfile) await login(token, profileId);
      setTimeout(() => {
        setEditing(false);
        setUpdateSuccess(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setUpdateError("Update fehlgeschlagen.");
    }
  };

  const friends = profileData.friends ?? [];

  const tabs: { id: ProfileTab; icon: string; label: string; count?: string | number }[] = [
    { id: "overview", icon: "📊", label: "Übersicht" },
    { id: "games", icon: "🎮", label: "Spiele", count: DUMMY_HISTORY.length },
    { id: "achievements", icon: "🏆", label: "Erfolge", count: "0/10" },
    ...(showFriends
      ? [{ id: "friends" as ProfileTab, icon: "👥", label: "Freunde", count: friends.length }]
      : []),
  ];

  return (
    <div className="profile-root">
      {/* Identity header */}
      <div className="profile-head">
        <div className="profile-head-row">
          <div className="profile-avatar">{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-name-row">
              <h1 className="profile-name">{profileData.username}</h1>
              <div className="profile-status-online">
                <span />
                <span>Online</span>
              </div>
            </div>
            <div className="profile-meta">
              {creationDate ? `Mitglied seit ${creationDate}` : "Mitglied"}
            </div>
          </div>
          {isOwnProfile && (
            <button
              type="button"
              className="sbb-btn sbb-btn--white sbb-btn--sm"
              onClick={editing ? () => setEditing(false) : handleStartEdit}
            >
              {editing ? "✕ Schliessen" : "✎ Bearbeiten"}
            </button>
          )}
        </div>
        {profileData.userBio && (
          <div className="profile-bio-shell">{profileData.userBio}</div>
        )}
      </div>

      {/* Hero stats */}
      <div className="profile-hero-stats">
        <div className="sbb-stat sbb-stat--gold">
          <div className="sbb-stat-icon">🏆</div>
          <div className="sbb-stat-value">{formatNumber(totalPoints)}</div>
          <div className="sbb-stat-label">Gesamtpunkte</div>
        </div>
        <div className="sbb-stat sbb-stat--dark">
          <div className="sbb-stat-icon">🎮</div>
          <div className="sbb-stat-value">{playedGames}</div>
          <div className="sbb-stat-label">Spiele</div>
        </div>
        <div className="sbb-stat">
          <div className="sbb-stat-icon">📊</div>
          <div className="sbb-stat-value">{formatNumber(avgPoints)}</div>
          <div className="sbb-stat-label">Ø Pkt / Spiel</div>
        </div>
        <div className="sbb-stat sbb-stat--green">
          <div className="sbb-stat-icon">🎯</div>
          <div className="sbb-stat-value">{(precision * 100).toFixed(1)}%</div>
          <div className="sbb-stat-label">Präzision</div>
        </div>
      </div>

      {/* Guest banner — only shown on own profile when logged in as guest.
          Prompts the user to register so they can unlock password change,
          friends list and persistent stats. */}
      {isOwnProfile && isGuest && (
        <div
          className="profile-guest-banner"
          style={{
            maxWidth: 1000,
            margin: "18px auto 0",
            padding: "12px 18px",
            background: "rgba(200,150,12,0.10)",
            borderLeft: "4px solid var(--gold)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--charcoal)",
            letterSpacing: "0.04em",
            lineHeight: 1.6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            Du spielst als <strong>Gast</strong> — Passwort & Freunde sind nur
            für registrierte Konten verfügbar.
          </span>
          <button
            type="button"
            className="sbb-btn sbb-btn--primary sbb-btn--sm"
            onClick={() => router.push("/register")}
          >
            Konto erstellen
          </button>
        </div>
      )}

      {/* Tabs are always visible — the edit form lives in a modal now,
          not inline, so we don't need to hide the page behind it. */}
      <>
          <div className="profile-tabs">
            <div className="profile-tabs-shell">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`profile-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <span style={{ fontSize: 15 }}>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className="profile-tab-count">{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-body">
            {tab === "overview" && (
              <>
                <section className="profile-section">
                  <div className="profile-section-head">
                    <h2>Statistik im Detail</h2>
                  </div>
                  <div className="profile-detail-stats">
                    <div className="profile-detail-stat">
                      <div className="profile-detail-stat-top">
                        <div className="profile-detail-stat-v">{formatNumber(totalPoints)}</div>
                        <div>🏆</div>
                      </div>
                      <div className="profile-detail-stat-l">Gesamtpunkte</div>
                    </div>
                    <div className="profile-detail-stat">
                      <div className="profile-detail-stat-top">
                        <div className="profile-detail-stat-v">{playedRounds}</div>
                        <div>🚂</div>
                      </div>
                      <div className="profile-detail-stat-l">Runden gespielt</div>
                    </div>
                    <div className="profile-detail-stat">
                      <div className="profile-detail-stat-top">
                        <div className="profile-detail-stat-v">{formatNumber(bestRound)}</div>
                        <div>⚡</div>
                      </div>
                      <div className="profile-detail-stat-l">Beste Runde</div>
                    </div>
                    <div className="profile-detail-stat">
                      <div className="profile-detail-stat-top">
                        <div className="profile-detail-stat-v">{(precision * 100).toFixed(1)}%</div>
                        <div>✔</div>
                      </div>
                      <div className="profile-detail-stat-l">Präzision</div>
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <div className="profile-section-head">
                    <h2>🎮 Letzte Spiele</h2>
                    <button
                      type="button"
                      className="sbb-link"
                      onClick={() => setTab("games")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: 0,
                      }}
                    >
                      Alle ansehen →
                    </button>
                  </div>
                  {DUMMY_HISTORY.slice(0, 3).map((g) => (
                    <div key={g.name} className="profile-history-row">
                      <span className="profile-history-icon">⚡</span>
                      <div className="profile-history-info">
                        <div className="profile-history-name">{g.name}</div>
                        <div className="profile-history-meta">
                          {g.date} · {g.rounds}
                        </div>
                      </div>
                      <div className="profile-history-score">{formatNumber(g.score)}</div>
                    </div>
                  ))}
                </section>
              </>
            )}

            {tab === "games" && (
              <section className="profile-section">
                <div className="profile-section-head">
                  <h2>🎮 Spielverlauf</h2>
                </div>
                {DUMMY_HISTORY.map((g) => (
                  <div key={g.name} className="profile-history-row">
                    <span className="profile-history-icon">⚡</span>
                    <div className="profile-history-info">
                      <div className="profile-history-name">{g.name}</div>
                      <div className="profile-history-meta">
                        {g.date} · {g.rounds}
                      </div>
                    </div>
                    <div className="profile-history-score">{formatNumber(g.score)}</div>
                  </div>
                ))}
              </section>
            )}

            {tab === "achievements" && (
              <section className="profile-section">
                <div className="profile-section-head">
                  <h2>🏆 Erfolge</h2>
                </div>
                <div className="lb-empty">Noch keine Erfolge freigeschaltet.</div>
              </section>
            )}

            {tab === "friends" && showFriends && (
              <section className="profile-section">
                <div className="profile-section-head">
                  <h2>👥 Freunde</h2>
                  {isOwnProfile && (
                    <button
                      type="button"
                      className="sbb-btn sbb-btn--primary sbb-btn--sm"
                      onClick={() => router.push("/leaderboard?addFriend=1")}
                    >
                      + Freund hinzufügen
                    </button>
                  )}
                </div>
                {friends.length === 0 ? (
                  <div className="lb-empty">
                    Noch keine Freunde.
                    {isOwnProfile && (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="sbb-link"
                          onClick={() => router.push("/leaderboard?addFriend=1")}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            font: "inherit",
                            color: "var(--red)",
                            padding: 0,
                          }}
                        >
                          Auf der Rangliste suchen →
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="profile-friends-grid">
                    {friends.map((f) => (
                      <div key={f.username} className="profile-friend-card">
                        <div className="profile-friend-avatar">
                          {f.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="profile-friend-name">{f.username}</div>
                          <div className="profile-friend-meta">Mitglied</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </>

      {/* Edit profile modal — replaces the old inline form. Only own
          profile and only when the user has hit "Bearbeiten". Guests
          see the dialog without the password section (see further down). */}
      {editing && isOwnProfile && (
        <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Profil bearbeiten">
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Modal schliessen"
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          />
          <form
            onSubmit={handleSave}
            className="sbb-modal"
            style={{
              position: "relative",
              zIndex: 1,
              padding: 0,
              borderTop: "none",
              maxWidth: 480,
              overflow: "hidden",
            }}
          >
            {/* Dark header */}
            <div
              style={{
                background: "var(--black)",
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2
                style={{
                  color: "var(--white)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Profil bearbeiten
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Schliessen"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  color: "var(--white)",
                  border: "none",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 16,
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {updateError && <div className="sbb-field-error">{updateError}</div>}
              {updateSuccess && (
                <div
                  className="sbb-field-error"
                  style={{
                    background: "rgba(45,106,79,0.10)",
                    borderLeftColor: "var(--green)",
                    color: "var(--green)",
                  }}
                >
                  ✓ Profil aktualisiert!
                </div>
              )}

              <div className="sbb-field">
                <div className="sbb-field-label">
                  <span className="label label--grey">Benutzername</span>
                </div>
                <input
                  className="sbb-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="sbb-field">
                <div className="sbb-field-label">
                  <span className="label label--grey">Bio</span>
                </div>
                <textarea
                  className="sbb-input sbb-textarea"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 200))}
                  placeholder="Erzähl was über dich…"
                  rows={3}
                />
                <div className="sbb-field-hint">{editBio.length}/200 Zeichen</div>
              </div>

              {/* Password change — registered users only. Guests have no
                  password to change, so the section is hidden entirely
                  and replaced by an upgrade hint. */}
              {showPasswordField ? (
                <div style={{ borderTop: "1px solid var(--warm)", paddingTop: 16 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--grey)",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Passwort ändern (optional)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      className="sbb-input"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Neues Passwort"
                      autoComplete="new-password"
                    />
                    <input
                      className="sbb-input"
                      type="password"
                      value={editPassword2}
                      onChange={(e) => setEditPassword2(e.target.value)}
                      placeholder="Passwort wiederholen"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="sbb-field-hint" style={{ marginTop: 8 }}>
                    Nach dem Speichern wirst du ausgeloggt und musst dich mit dem neuen Passwort anmelden.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(200,150,12,0.12)",
                    borderLeft: "3px solid var(--gold)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--charcoal)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.6,
                  }}
                >
                  Gäste haben kein Passwort.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      router.push("/register");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--red)",
                      cursor: "pointer",
                      font: "inherit",
                      padding: 0,
                      textDecoration: "underline",
                      fontWeight: 700,
                    }}
                  >
                    Konto erstellen
                  </button>{" "}
                  für Passwort, Freunde und persistente Stats.
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--warm)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="sbb-btn sbb-btn--secondary sbb-btn--md"
                onClick={() => setEditing(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="sbb-btn sbb-btn--primary sbb-btn--md">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
