"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { UserAuthDTO, LoginPostDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

/* SBB cross icon — sized via CSS (.auth-cross-box svg). */
const SBBCross = () => (
  <svg viewBox="0 0 22 22" fill="#FFFFFF" aria-hidden="true">
    <rect x="7" y="0" width="8"  height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8"  rx="1" />
  </svg>
);

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { login } = useAuth();

  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Bitte gib Benutzername und Passwort ein.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const credentials: LoginPostDTO = { username: username.trim(), password };
      const response = await apiService.post<UserAuthDTO>("/login", credentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Login fehlgeschlagen. Bitte überprüfe deine Daten.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* LEFT — brand panel */}
      <div className="auth-panel--brand">
        <div className="auth-circle auth-circle--tr" />
        <div className="auth-circle auth-circle--bl" />

        <div className="auth-brand-content">
          <div className="auth-cross-box"><SBBCross /></div>
          <h1 className="auth-headline">Willkommen zurück!</h1>
          <p className="auth-description">
            Logg dich ein und beweise, dass du die Schweizer Strecken kennst.
          </p>
          <div className="auth-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-card-value">12K+</div>
              <div className="auth-stat-card-label">Spieler</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-card-value">50K+</div>
              <div className="auth-stat-card-label">Runden</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="auth-panel--form">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <span className="eyebrow eyebrow--red">Anmelden</span>
          <h2 className="auth-title">Willkommen zurück</h2>
          <p className="auth-subtitle">Spiel weiter, wo du aufgehört hast.</p>

          <div className="auth-field">
            <div className="auth-field-header">
              <span className="eyebrow eyebrow--grey">Benutzername</span>
            </div>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ZürichHB_Master"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <span className="eyebrow eyebrow--grey">Passwort</span>
            </div>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-submit-wrap">
            <button
              type="submit"
              className="sbb-btn-home sbb-btn-home--primary"
              disabled={submitting}
            >
              {submitting ? "ANMELDEN…" : "ANMELDEN"}
            </button>
          </div>

          <p className="auth-footer">
            Kein Account?{" "}
            <button
              type="button"
              className="auth-footer-link"
              onClick={() => router.push("/register")}
            >
              Registrieren
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;