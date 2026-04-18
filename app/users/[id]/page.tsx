"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { MyUserDTO, UserDTO } from "@/types/user";
import { useApi } from "@/hooks/useApi";
import { fetchUser } from "@/utils/fetchUser";
import { Button, Tabs, Input, Form } from "antd";

// Dummy Game History
const DUMMY_HISTORY = [
  { name: "Pendler-Challenge", date: "10. Mar", rounds: "5R", score: 4280 },
  { name: "Mittagspause Express", date: "09. Mar", rounds: "3R", score: 2340 },
  { name: "SBB Marathon", date: "08. Mar", rounds: "10R", score: 7820 },
  { name: "Anfänger Runde", date: "07. Mar", rounds: "1R", score: 620 },
  { name: "Geheime Runde", date: "06. Mar", rounds: "5R", score: 3950 },
];

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

const Profile: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const profileId = Number(useParams().id);
  const [user, setUser] = useState<MyUserDTO | UserDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();



  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("token") || '""') as string;

    const fetchUser = async () => {
      try {
        const userData = await apiService.get(
          `/users/${Number(profileId)}`,
          {
            headers: { token: token },
          }
        ) as MyUserDTO | UserDTO;


        if ("email" in userData) {
          return userData as MyUserDTO;
        } else {
          return userData as UserDTO;

        }
      }
      catch (error) {
        throw error
      }
    }

    fetchUser()
      .then((data) => setUser(data))
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
        router.push("/login");
      });

  }, [router]);

  if (!user) {
    return (
      <div className="page-center page-content">
        <p className="u-text-muted">Loading profile...</p>
      </div>
    );
  }

  const initial = user.username ? user.username[0].toUpperCase() : "?";
  const creationDate = user.creationDate
    ? new Date(user.creationDate).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : "";

  const scoreboard = user.userScoreboard;
  const totalPoints = scoreboard?.totalPoints ?? 0;
  const gamesPlayed = scoreboard?.gamesPlayed ?? 0;
  const gamesWon = scoreboard?.gamesWon ?? 0;
  const precision = scoreboard?.guessingPrecision ?? 0;
  const avgPoints = gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const handleEdit = () => {
    form.setFieldsValue({
      username: user.username,
      userBio: user.userBio || "",
      password: "",
    });
    setEditing(true);
  };

  const handleSave = async (values: { username: string; userBio: string; password: string }) => {
    /*try {
      await apiService.put(`/users/${Number(profileId)}`, {
        username: values.username,
        userBio: values.userBio,
        password: values.password || undefined,
        email: user.email,
        userId: Number(userId),
        token: token,
      });
      setUser({ ...user, username: values.username, userBio: values.userBio });
      setEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
    }*/
  };

  return (
    <div className="page-root page-content">
      <div className="profile-card card--wide">

        {/* ── Header ── */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar" style={{ background: "var(--red)" }}>
              {initial}
            </div>
            <div className="profile-online-dot" />
          </div>
          <div className="profile-header-info">
            <h2 className="profile-username">{user.username}</h2>
            {user.userBio && <p className="profile-bio">{user.userBio}</p>}
            <div className="profile-meta-row">
              <span className="badge badge-online">Online</span>
              {creationDate && (
                <span className="profile-joined">Mitglied seit {creationDate}</span>
              )}
            </div>
          </div>
          {!editing ? (
            <Button className="profile-edit-btn" size="middle" onClick={handleEdit}>
              ⚙️ Edit
            </Button>
          ) : (
            <Button className="profile-edit-btn" size="middle" onClick={() => setEditing(false)}>
              ⊘ Close
            </Button>
          )}
        </div>

        {/* ── Edit Form (toggles with editing state) ── */}
        {editing && (
          <div className="profile-edit-form">
            <Form
              form={form}
              layout="vertical"
              size="large"
              onFinish={handleSave}
            >
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
              <div className="profile-edit-hint">
                Changing your password will log you out. You&apos;ll need to log in again.
              </div>

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

        {/* ── Stats Cards — nur sichtbar wenn NICHT editing ── */}
        {!editing && (
          <>
            <div className="profile-stats-cards">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🏅</div>
                <div className="profile-stat-card-value">#—</div>
                <div className="profile-stat-card-label">World Wide Ranking</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">⭐</div>
                <div className="profile-stat-card-value">{formatNumber(totalPoints)}</div>
                <div className="profile-stat-card-label">Overall Points</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🎮</div>
                <div className="profile-stat-card-value">{gamesPlayed}</div>
                <div className="profile-stat-card-label">Overall Games</div>
              </div>
            </div>
            <div className="profile-stats-cards">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">📊</div>
                <div className="profile-stat-card-value">{formatNumber(avgPoints)}</div>
                <div className="profile-stat-card-label">Ø Points / Game</div>
              </div>
              <div className="profile-stat-card profile-stat-card--highlight">
                <div className="profile-stat-icon">🎯</div>
                <div className="profile-stat-card-value profile-stat-value--red">
                  {(precision * 100).toFixed(1)}%
                </div>
                <div className="profile-stat-card-label">Overall Precision</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🏆</div>
                <div className="profile-stat-card-value">{gamesWon} ({winRate}%)</div>
                <div className="profile-stat-card-label">Games Won</div>
              </div>
            </div>
          </>
        )}

        {/* ── Tabs ── */}
        <div className="profile-tabs-wrapper">
          <Tabs
            defaultActiveKey="history"
            items={[
              {
                key: "history",
                label: "Game History",
                children: (
                  <div>
                    {DUMMY_HISTORY.map((game, i) => (
                      <div key={i} className="profile-history-row">
                        <span className="profile-history-icon">⚡</span>
                        <div className="profile-history-info">
                          <div className="profile-history-name">{game.name}</div>
                          <div className="profile-history-meta">{game.date} · {game.rounds}</div>
                        </div>
                        <div className="profile-history-score">{formatNumber(game.score)}</div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "friends",
                label: `Friends (${user.friends?.length ?? 0})`,
                children: <p className="u-text-muted">No friends yet.</p>,
              },
              {
                key: "success",
                label: "Success (0/10)",
                children: <p className="u-text-muted">No achievements yet.</p>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;