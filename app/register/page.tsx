"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { RegisterPostDTO, UserAuthDTO, LoginPostDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

/* SBB cross icon — sized via CSS (.auth-cross-box svg). */
const SBBCross = () => (
  <svg viewBox="0 0 22 22" fill="#FFFFFF" aria-hidden="true">
    <rect x="7" y="0" width="8"  height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8"  rx="1" />
  </svg>
);

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { login } = useAuth();

  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [bio, setBio]               = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError("Bitte fülle Benutzername, E-Mail und Passwort aus.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload: RegisterPostDTO = {
        username: username.trim(),
        email:    email.trim(),
        password,
        userBio:  bio.trim() || null,
        isGuest:  false,
      };
      await apiService.post<UserAuthDTO>("/register", payload);

      // Auto-login after successful registration
      const loginCredentials: LoginPostDTO = {
        username: payload.username,
        password: payload.password,
      };
      const response = await apiService.post<UserAuthDTO>("/login", loginCredentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
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
          <h1 className="auth-headline">Bereit für die Schweiz?</h1>
          <p className="auth-description">
            Erstelle dein Konto und steig ein in die SBB-Liga.
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
          <span className="eyebrow eyebrow--red">Registrieren</span>
          <h2 className="auth-title">Konto erstellen</h2>
          <p className="auth-subtitle">In 30 Sekunden bist du dabei.</p>

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
              <span className="eyebrow eyebrow--grey">E-Mail</span>
            </div>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="zug@sbb.ch"
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <span className="eyebrow eyebrow--grey">Bio</span>
              <span className="auth-field-optional">(OPTIONAL)</span>
            </div>
            <textarea
              className="auth-input auth-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Passionierter Bahnfan aus Zürich..."
              rows={3}
              maxLength={200}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-submit-wrap">
            <button
              type="submit"
              className="sbb-btn-home sbb-btn-home--primary"
              disabled={submitting}
            >
              {submitting ? "KONTO ERSTELLEN…" : "KONTO ERSTELLEN"}
            </button>
          </div>

          <p className="auth-footer">
            Bereits registriert?{" "}
            <button
              type="button"
              className="auth-footer-link"
              onClick={() => router.push("/login")}
            >
              Anmelden
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;