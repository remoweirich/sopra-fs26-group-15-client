"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { MyUserDTO, UserDTO } from "@/types/user";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import {getApiDomain} from "@/utils/domain";
import {Image} from "antd";

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

    const backendBase = getApiDomain()
    const [profileData, setProfileData] = useState<MyUserDTO | UserDTO | null>(null);
    const [editing, setEditing] = useState(false);
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as ProfileTab) || "overview";
    const [tab, setTab] = useState<ProfileTab>(initialTab);

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editPassword2, setEditPassword2] = useState("");
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const isOwnProfile = currentUser?.userId === profileId;

    const [friends, setFriends] = useState<UserDTO[]>([]);
    const [pendingReceived, setPendingReceived] = useState<UserDTO[]>([]);
    const [pendingSent, setPendingSent] = useState<UserDTO[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiService.get<MyUserDTO | UserDTO>(`/users/${profileId}`, {
                    headers: { token: token ?? "" },
                });
                setProfileData(data);
            } catch (error) {
                console.error(error);
                router.push("/lobbies");
            }
        };
        loadProfile();
    }, [profileId, token, router, apiService]);

    useEffect(() => {
        if (profileId === 1 && currentUser && token) {
            const timer = setTimeout(async () => {
                try {
                    await apiService.post(`/award/kingbababui`,
                        {},
                        { headers: { userId: currentUser.userId.toString(), token: token ?? "" } }
                    );
                } catch (error) {
                    console.error("Failed to award achievement:", error);
                }
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [profileId, currentUser, token, apiService]);

    useEffect(() => {
        if (tab !== "friends" || !profileData || !token) return;

        const fetchFriends = async () => {
            setIsLoadingFriends(true);
            try {
                const friendsData = await apiService.get<UserDTO[]>(`/friends/${profileId}`, {
                    headers: { token },
                });
                setFriends(friendsData);

                if (isOwnProfile) {
                    const [received, sent] = await Promise.all([
                        apiService.get<UserDTO[]>(`/friends/${profileId}/pendingReceived`, { headers: { token } }),
                        apiService.get<UserDTO[]>(`/friends/${profileId}/pendingSent`, { headers: { token } }),
                    ]);
                    setPendingReceived(received);
                    setPendingSent(sent);
                }
            } catch (error) {
                console.error("Error when loading friends", error);
            } finally {
                setIsLoadingFriends(false);
            }
        };

        fetchFriends();
    }, [tab, profileId, profileData, token, isOwnProfile, apiService]);

    const refreshFriends = React.useCallback(async () => {
        if (!token) return;
        try {
            const friendsData = await apiService.get<UserDTO[]>(`/friends/${profileId}`, {
                headers: { token: token ?? "", userId: profileId.toString() },
            });
            setFriends(friendsData);

            if (isOwnProfile) {
                const [received, sent] = await Promise.all([
                    apiService.get<UserDTO[]>(`/friends/${profileId}/pendingReceived`, { headers: { token } }),
                    apiService.get<UserDTO[]>(`/friends/${profileId}/pendingSent`, { headers: { token } }),
                ]);
                setPendingReceived(received);
                setPendingSent(sent);
            }
        } catch (error) {
            console.error("Error when refreshing friends", error);
        }
    }, [token, profileId, isOwnProfile, apiService]);

    if (isLoading || !profileData) {
        return <div className="page-loading">Lade Profil…</div>;
    }

    const profileAsAny = profileData as Partial<MyUserDTO>;
    const isGuest =
        profileAsAny.isGuest === true || profileData.username?.startsWith("guest_") ||
        profileAsAny.email?.endsWith("@guest.com") === true;
    const showFriends = !isGuest;
    const showPasswordField = !isGuest;

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
    const gamesWon = scoreboard?.gamesWon ?? 0;

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


    const handleAccept = async (requestingUserId: number) => {
        try {
            await apiService.post(`/friends/accept/${requestingUserId}`,
                {},
                { headers: { userId: profileId.toString(), token: token ?? "" } }
            );

            await refreshFriends();

        } catch (error) {
            console.error("Error when accepting request:", error);
        }
    };

    const handleReject = async (requestingUserId: number) => {
        try {
            await apiService.post(`/friends/reject/${requestingUserId}`,
                {},
                {
                    headers: { userId: profileId.toString(), token: token ?? "" }
                });

            await refreshFriends();

        } catch (error) {
            console.error("Error when reject request:", error);
        }
    };


    const tabs: { id: ProfileTab; icon: string; label: string; count?: string | number }[] = [
        { id: "overview", icon: "📊", label: "Übersicht" },
        { id: "games", icon: "🎮", label: "Spiele", count: DUMMY_HISTORY.length },
        { id: "achievements", icon: "🏆", label: "Erfolge", count: `${(profileData as Partial<MyUserDTO>).userAchievementDTOList?.length ?? 0}/10` },
        ...(showFriends
            ? [{ id: "friends" as ProfileTab, icon: "👥", label: "Freunde" }]
            : []),
    ];

    return (
        <div className="profile-root">
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
                {profileData.userBio && <div className="profile-bio-shell">{profileData.userBio}</div>}
            </div>

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
                    <div className="sbb-stat-icon">🥇</div>
                    <div className="sbb-stat-value">{gamesWon}</div>
                    <div className="sbb-stat-label">Spiele gewonnen</div>
                </div>
            </div>

            {isOwnProfile && isGuest && (
                <div className="profile-guest-banner" style={{ maxWidth: 1000, margin: "18px auto 0", padding: "12px 18px", background: "rgba(200,150,12,0.10)", borderLeft: "4px solid var(--gold)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--charcoal)", letterSpacing: "0.04em", lineHeight: 1.6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span>Du spielst als <strong>Gast</strong> — Passwort & Freunde sind nur für registrierte Konten verfügbar.</span>
                    <button type="button" className="sbb-btn sbb-btn--primary sbb-btn--sm" onClick={() => router.push("/register")}>Konto erstellen</button>
                </div>
            )}

            <div className="profile-tabs">
                <div className="profile-tabs-shell">
                    {tabs.map((t) => (
                        <button key={t.id} type="button" className={`profile-tab ${tab === t.id ? "is-active" : ""}`} onClick={() => setTab(t.id)}>
                            <span style={{ fontSize: 15 }}>{t.icon}</span>
                            <span>{t.label}</span>
                            {t.count !== undefined && <span className="profile-tab-count">{t.count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="profile-body">
                {tab === "overview" && (
                    <>
                        <section className="profile-section">
                            <div className="profile-section-head"><h2>Statistik im Detail</h2></div>
                            <div className="profile-detail-stats">
                                <div className="profile-detail-stat">
                                    <div className="profile-detail-stat-top"><div className="profile-detail-stat-v">{playedRounds}</div><div>🚂</div></div>
                                    <div className="profile-detail-stat-l">Runden gespielt</div>
                                </div>
                                <div className="profile-detail-stat">
                                    <div className="profile-detail-stat-top"><div className="profile-detail-stat-v">{formatNumber(bestRound)}</div><div>⚡</div></div>
                                    <div className="profile-detail-stat-l">Beste Runde</div>
                                </div>
                                <div className="profile-detail-stat">
                                    <div className="profile-detail-stat-top"><div className="profile-detail-stat-v">{(precision).toFixed(1)}%</div><div>✔</div></div>
                                    <div className="profile-detail-stat-l">Präzision</div>
                                </div>
                            </div>
                        </section>
                        <section className="profile-section">
                            <div className="profile-section-head"><h2>🎮 Letzte Spiele</h2><button type="button" className="sbb-link" onClick={() => setTab("games")} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", padding: 0 }}>Alle ansehen →</button></div>
                            {DUMMY_HISTORY.slice(0, 3).map((g) => (
                                <div key={g.name} className="profile-history-row"><span className="profile-history-icon">⚡</span><div className="profile-history-info"><div className="profile-history-name">{g.name}</div><div className="profile-history-meta">{g.date} · {g.rounds}</div></div><div className="profile-history-score">{formatNumber(g.score)}</div></div>
                            ))}
                        </section>
                    </>
                )}

                {tab === "games" && (
                    <section className="profile-section">
                        <div className="profile-section-head"><h2>🎮 Spielverlauf</h2></div>
                        {DUMMY_HISTORY.map((g) => (
                            <div key={g.name} className="profile-history-row"><span className="profile-history-icon">⚡</span><div className="profile-history-info"><div className="profile-history-name">{g.name}</div><div className="profile-history-meta">{g.date} · {g.rounds}</div></div><div className="profile-history-score">{formatNumber(g.score)}</div></div>
                        ))}
                    </section>
                )}

                {tab === "achievements" && (
                    <section className="profile-section">
                        <div className="profile-section-head">
                            <h2>🏆 Erfolge</h2>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", letterSpacing: "0.08em" }}>
                            {(profileData as Partial<MyUserDTO>).userAchievementDTOList?.length ?? 0} freigeschaltet
                            </span>
                        </div>

                        {(() => {
                            const list = (profileData as Partial<MyUserDTO>).userAchievementDTOList ?? [];
                            if (list.length === 0) {
                                return <div className="lb-empty">Noch keine Erfolge freigeschaltet.</div>;
                            }
                            return (
                                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                    {list.map(({ achievement, unlockedAt }) => (
                                        <div key={achievement.achievementId} className="profile-history-row">
                                            <Image
                                                src={`${backendBase}${achievement.iconUrl}`}
                                                alt={achievement.name}
                                                style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
                                            />
                                            <div className="profile-history-info">
                                                <div className="profile-history-score">{achievement.name}</div>
                                                <div className={"profile-history-meta"}>{new Date(unlockedAt).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}</div>
                                            </div>
                                            <div className="profile-history-meta">
                                                <div className="profile-history-name">{achievement.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </section>
                )}

                {tab === "friends" && showFriends && (
                    <section className="profile-section">
                        <div className="profile-section-head">
                            <h2>👥 Freunde</h2>
                            {isOwnProfile && (
                                <button type="button" className="sbb-btn sbb-btn--primary sbb-btn--sm" onClick={() => router.push("/leaderboard?addFriend=1")}>+ Freund hinzufügen</button>
                            )}
                        </div>
                        {isLoadingFriends ? (
                            <div className="lb-empty">Lade Freunde...</div>
                        ) : friends.length === 0 ? (
                            <div className="lb-empty">
                                Noch keine Freunde vorhanden.
                                {isOwnProfile && <button type="button" className="sbb-link" onClick={() => router.push("/leaderboard?addFriend=1")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--red)", marginLeft: "5px" }}>Auf der Rangliste suchen →</button>}
                            </div>
                        ) : (
                            <div className="profile-friends-grid">
                                {friends.map((f) => (
                                    <div key={f.userId} className="profile-friend-card" onClick={() => router.push(`/users/${f.userId}`)} style={{ cursor: "pointer" }}>
                                        <div className="profile-friend-avatar">{f.username?.[0]?.toUpperCase() ?? "?"}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}><div className="profile-friend-name">{f.username}</div><div className="profile-friend-meta">Mitglied</div></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isOwnProfile && (pendingReceived.length > 0 || pendingSent.length > 0) && (
                            <div style={{ marginTop: "40px" }}>
                                <div className="profile-section-head"><h2>📩 Offene Anfragen</h2></div>
                                {pendingReceived.length > 0 && (
                                    <div style={{ marginBottom: "20px" }}>
                                        <h3 style={{ fontSize: "14px", color: "var(--grey)", marginBottom: "10px", textTransform: "uppercase" }}>Erhalten</h3>
                                        {pendingReceived.map((req) => (
                                            <div key={req.userId} className="profile-history-row">
                                                <div className="profile-history-info"><div className="profile-history-name">{req.username}</div><div className="profile-history-meta">Möchte dein Freund sein</div></div>
                                                <button className="sbb-btn sbb-btn--primary sbb-btn--sm" onClick={() => {handleAccept(req.userId)}}>Annehmen</button>
                                                <button className="sbb-btn sbb-btn--primary sbb-btn--sm"
                                                        onClick={() => {handleReject(req.userId)}}
                                                        style={{ background: "grey", borderColor: "black" }}
                                                >Ablehnen
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {pendingSent.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: "14px", color: "var(--grey)", marginBottom: "10px", textTransform: "uppercase" }}>Gesendet</h3>
                                        {pendingSent.map((sent) => (
                                            <div key={sent.userId} className="profile-history-row" style={{ opacity: 0.7 }}>
                                                <div className="profile-history-info"><div className="profile-history-name">{sent.username}</div><div className="profile-history-meta">Warte auf Antwort...</div></div>
                                                <span className="badge">Pendent</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {editing && isOwnProfile && (
                <div className="sbb-modal-overlay" role="dialog" aria-modal="true" aria-label="Profil bearbeiten">
                    <button type="button" onClick={() => setEditing(false)} aria-label="Modal schliessen" style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer" }} />
                    <form onSubmit={handleSave} className="sbb-modal" style={{ position: "relative", zIndex: 1, padding: 0, borderTop: "none", maxWidth: 480, overflow: "hidden" }}>
                        <div style={{ background: "var(--black)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <h2 style={{ color: "var(--white)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", margin: 0 }}>Profil bearbeiten</h2>
                            <button type="button" onClick={() => setEditing(false)} aria-label="Schliessen" style={{ background: "rgba(255,255,255,0.10)", color: "var(--white)", border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, fontFamily: "var(--font-sans)", lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        </div>
                        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {updateError && <div className="sbb-field-error">{updateError}</div>}
                            {updateSuccess && <div className="sbb-field-error" style={{ background: "rgba(45,106,79,0.10)", borderLeftColor: "var(--green)", color: "var(--green)" }}>✓ Profil aktualisiert!</div>}
                            <div className="sbb-field"><div className="sbb-field-label"><span className="label label--grey">Benutzername</span></div><input className="sbb-input" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                            <div className="sbb-field"><div className="sbb-field-label"><span className="label label--grey">Bio</span></div><textarea className="sbb-input sbb-textarea" value={editBio} onChange={(e) => setEditBio(e.target.value.slice(0, 200))} placeholder="Erzähl was über dich…" rows={3} /><div className="sbb-field-hint">{editBio.length}/200 Zeichen</div></div>
                            {showPasswordField ? (
                                <div style={{ borderTop: "1px solid var(--warm)", paddingTop: 16 }}>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--grey)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Passwort ändern (optional)</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <input className="sbb-input" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Neues Passwort" />
                                        <input className="sbb-input" type="password" value={editPassword2} onChange={(e) => setEditPassword2(e.target.value)} placeholder="Passwort wiederholen" />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: "10px 14px", background: "rgba(200,150,12,0.12)", borderLeft: "3px solid var(--gold)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--charcoal)", letterSpacing: "0.04em", lineHeight: 1.6 }}>Gäste haben kein Passwort. <button type="button" onClick={() => { setEditing(false); router.push("/register"); }} style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", font: "inherit", padding: 0, textDecoration: "underline", fontWeight: 700 }}>Konto erstellen</button> für Passwort, Freunde und persistente Stats.</div>
                            )}
                        </div>
                        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--warm)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button type="button" className="sbb-btn sbb-btn--secondary sbb-btn--md" onClick={() => setEditing(false)}>Abbrechen</button>
                            <button type="submit" className="sbb-btn sbb-btn--primary sbb-btn--md">Speichern</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;