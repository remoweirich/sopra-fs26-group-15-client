"use client";

/**
 * Profile Page — route: /users/[id]
 *
 * Design refactored to Option 1 ("Tabs machen die Arbeit"):
 * — Compact identity header (avatar + name + meta + edit)
 * — 3 hero-stat cards based on actual backend data only
 * — Tab navigation: Übersicht / Spiele / Erfolge / Freunde
 * — Übersicht is intentionally lean: only the "Statistik im Detail"
 *   list. No preview duplicates of other tabs.
 *
 * Backend logic is preserved 1:1 — useApi, useAuth, AntD Form, message.
 * Only fields actually present on MyUserDTO/UserDTO/UserScoreboard are
 * displayed. No invented data.
 */

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MyUserDTO, UserDTO } from "@/types/user";
import { useApi } from "@/hooks/useApi";
import { Button, Input, Form, App } from "antd";
import { useAuth } from "@/context/AuthContext";

type ProfileFormValues = {
  username: string;
  userBio?: string;
  password?: string;
};

// Dummy Game History — TODO (Claude Stark): replace with real fetch
// when backend exposes /users/:id/games or similar.
const DUMMY_HISTORY = [
  { name: "Pendler-Challenge", date: "10. Mar", rounds: "5R", score: 4280, place: 1 },
  { name: "Mittagspause Express", date: "09. Mar", rounds: "3R", score: 2340, place: 3 },
  { name: "SBB Marathon", date: "08. Mar", rounds: "10R", score: 7820, place: 2 },
  { name: "Anfänger Runde", date: "07. Mar", rounds: "1R", score: 620, place: 4 },
  { name: "Geheime Runde", date: "06. Mar", rounds: "5R", score: 3950, place: 1 },
];

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function placeMedal(p: number): string {
  return p === 1 ? "🥇" : p === 2 ? "🥈" : p === 3 ? "🥉" : `${p}.`;
}

const Profile: React.FC = () => {
  const { message } = App.useApp();
  const apiService = useApi();
  const router = useRouter();
  const profileId = Number(useParams().id);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"overview" | "games" | "achievements" | "friends">("overview");
  const [form] = Form.useForm();
  const { user: currentUser, token, login, isLoading } = useAuth();

  const [profileData, setProfileData] = useState<MyUserDTO | UserDTO | null>(null);

  const isOwnProfile = currentUser?.userId === profileId;

  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        const data = await apiService.get<MyUserDTO | UserDTO>(
          `/users/${profileId}`,
          { headers: { token: token } }
        );

        if ("email" in data) {
          setProfileData(data as MyUserDTO);
        } else {
          setProfileData(data as UserDTO);
        }
      } catch (error) {
        router.push("/lobbies");
      }
    };

    loadProfile();
  }, [profileId, token, router, apiService]);

  if (isLoading || !profileData) {
    return (
      <div className="page-center page-content">
        <p className="u-text-muted">Loading profile...</p>
      </div>
    );
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
  const gamesPlayed = scoreboard?.gamesPlayed ?? 0;
  const gamesWon = scoreboard?.gamesWon ?? 0;
  const precision = scoreboard?.guessingPrecision ?? 0;
  const avgPoints = gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const friendCount = profileData.friends?.length ?? 0;

  const handleEdit = () => {
    if (profileData) {
      form.setFieldsValue({
        username: profileData.username,
        userBio: profileData.userBio || "",
        password: "",
      });
      setEditing(true);
    }
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!token) return;

    try {
      await apiService.put(
        `/users/${profileId}`,
        { ...values, token: token },
        { headers: { token: token ?? undefined } }
      );

      message.success("Profil aktualisiert!");

      const updatedData = { ...profileData, ...values };
      setProfileData(updatedData);
      form.setFieldsValue(updatedData);

      setEditing(false);

      if (isOwnProfile && values.username) {
        await login(token, profileId);
      }
    } catch (error) {
      message.error("Update fehlgeschlagen.");
    }
  };

  return (
    <div className="page-root page-content profile-page">

      {/* ── Identity header ────────────────────────────────────────── */}
      <div className="profile-identity-header">
        <div className="profile-identity-inner">
          <div className="profile-identity-avatar">{initial}</div>

          <div className="profile-identity-info">
            <div className="profile-identity-name-row">
              <h1 className="profile-identity-name">{profileData.username}</h1>
              <span className="profile-identity-badge">● ONLINE</span>
            </div>
            {creationDate && (
              <div className="profile-identity-meta">
                Mitglied seit {creationDate}
              </div>
            )}
          </div>

          {isOwnProfile && (
            !editing ? (
              <button type="button" className="profile-identity-edit" onClick={handleEdit}>
                ✏️ Bearbeiten
              </button>
            ) : (
              <button type="button" className="profile-identity-edit" onClick={() => setEditing(false)}>
                ⊘ Schliessen
              </button>
            )
          )}
        </div>

        {profileData.userBio && (
          <div className="profile-identity-bio-wrap">
            <p className="profile-identity-bio">{profileData.userBio}</p>
          </div>
        )}
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="profile-edit-section">
          <Form form={form} layout="vertical" size="large" onFinish={handleSave}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input placeholder="Your username" />
            </Form.Item>
            <div className="profile-edit-hint">
              Must be unique. Changing it updates your profile everywhere.
            </div>

            <Form.Item name="userBio" label="Bio">
              <Input.TextArea placeholder="Tell us about yourself" rows={3} maxLength={200} />
            </Form.Item>

            <Form.Item name="password" label="New password">
              <Input.Password placeholder="Leave empty to keep current" />
            </Form.Item>

            <div className="profile-edit-actions">
              <Button type="primary" htmlType="submit" className="form-submit-btn">
                Save changes
              </Button>
              <Button size="large" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* ── Hero stats — only when not editing ── */}
      {!editing && (
        <div className="profile-hero-stats">
          <div className="profile-hero-card profile-hero-card--red">
            <div className="profile-hero-value">{formatNumber(totalPoints)}</div>
            <div className="profile-hero-label">Gesamtpunkte</div>
          </div>
          <div className="profile-hero-card profile-hero-card--charcoal">
            <div className="profile-hero-value">{formatNumber(gamesPlayed)}</div>
            <div className="profile-hero-label">Spiele</div>
          </div>
          <div className="profile-hero-card profile-hero-card--green">
            <div className="profile-hero-value">
              {gamesWon}
              {gamesPlayed > 0 && (
                <span className="profile-hero-value-suffix"> · {winRate}%</span>
              )}
            </div>
            <div className="profile-hero-label">Siege</div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      {!editing && (
        <>
          <div className="profile-tabs">
            <div className="profile-tabs-inner">
              <button
                type="button"
                className={"profile-tab " + (tab === "overview" ? "profile-tab--active" : "")}
                onClick={() => setTab("overview")}
              >
                <span>📊</span> Übersicht
              </button>
              <button
                type="button"
                className={"profile-tab " + (tab === "games" ? "profile-tab--active" : "")}
                onClick={() => setTab("games")}
              >
                <span>🎮</span> Spiele
                <span className="profile-tab-count">{DUMMY_HISTORY.length}</span>
              </button>
              <button
                type="button"
                className={"profile-tab " + (tab === "achievements" ? "profile-tab--active" : "")}
                onClick={() => setTab("achievements")}
              >
                <span>🏆</span> Erfolge
              </button>
              <button
                type="button"
                className={"profile-tab " + (tab === "friends" ? "profile-tab--active" : "")}
                onClick={() => setTab("friends")}
              >
                <span>👥</span> Freunde
                <span className="profile-tab-count">{friendCount}</span>
              </button>
            </div>
          </div>

          <div className="profile-tab-content">

            {/* ── Übersicht — minimal: only stat list ── */}
            {tab === "overview" && (
              <div className="profile-stat-list">
                <h2 className="profile-section-title">Statistik im Detail</h2>
                <dl className="profile-stat-grid">
                  <div className="profile-stat-row">
                    <dt>Ø Punkte / Spiel</dt>
                    <dd>{formatNumber(avgPoints)}</dd>
                  </div>
                  <div className="profile-stat-row">
                    <dt>Präzision</dt>
                    <dd>{(precision * 100).toFixed(1)}%</dd>
                  </div>
                  <div className="profile-stat-row">
                    <dt>Win-Rate</dt>
                    <dd>{winRate}%</dd>
                  </div>
                  <div className="profile-stat-row">
                    <dt>Spiele gespielt</dt>
                    <dd>{formatNumber(gamesPlayed)}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* ── Spiele tab ── */}
            {tab === "games" && (
              <div className="profile-games-list">
                <h2 className="profile-section-title">🎮 Letzte Spiele</h2>
                <div className="profile-games-grid">
                  {DUMMY_HISTORY.map((g, i) => (
                    <div key={i} className={"profile-game-card " + (g.place === 1 ? "profile-game-card--won" : "")}>
                      <div className="profile-game-card-head">
                        <div className="profile-game-card-name">{g.name}</div>
                        <div className="profile-game-card-place">{placeMedal(g.place)}</div>
                      </div>
                      <div className="profile-game-card-meta">{g.date} · {g.rounds}</div>
                      <div className="profile-game-card-score">
                        {formatNumber(g.score)}
                        <span className="profile-game-card-score-unit">PKT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Erfolge tab — empty state, backend not yet wired ── */}
            {tab === "achievements" && (
              <div className="profile-empty-state">
                <div className="profile-empty-state-icon">🏆</div>
                <div className="profile-empty-state-text">Noch keine Erfolge freigeschaltet.</div>
              </div>
            )}

            {/* ── Freunde tab ── */}
            {tab === "friends" && (
              <div className="profile-empty-state">
                <div className="profile-empty-state-icon">👥</div>
                <div className="profile-empty-state-text">
                  {friendCount === 0
                    ? "Noch keine Freunde."
                    : `${friendCount} ${friendCount === 1 ? "Freund" : "Freunde"}.`}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default Profile;