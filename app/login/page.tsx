"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { UserAuthDTO, LoginPostDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { useState, FormEvent } from "react";

// SBB cross — kept here so the auth page stays self-contained
const SBBCross = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="#fff" aria-hidden="true">
    <rect x="7" y="0" width="8" height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8" rx="1" />
  </svg>
);

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage("Bitte gib Benutzername und Passwort ein.");
      return;
    }

    setSubmitting(true);
    try {
      const credentials: LoginPostDTO = { username: username.trim(), password };
      const response = await apiService.post<UserAuthDTO>("/login", credentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      if (status === 404) setErrorMessage("Login fehlgeschlagen: Benutzer nicht gefunden.");
      else if (status === 401) setErrorMessage("Login fehlgeschlagen: Falscher Benutzername oder Passwort.");
      else setErrorMessage("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      {/* Left brand panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-icon">
            <SBBCross size={34} />
          </div>
          <h1>Willkommen zurück!</h1>
          <p>Logg dich ein und beweise, dass du die Schweizer Strecken kennst.</p>
          <div className="auth-left-stats">
            <div className="auth-left-stat">
              <div className="auth-left-stat-v">12K+</div>
              <div className="auth-left-stat-l">Spieler</div>
            </div>
            <div className="auth-left-stat">
              <div className="auth-left-stat-v">50K+</div>
              <div className="auth-left-stat-l">Runden</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-right-content">
          <span className="label">Anmelden</span>
          <h2>Willkommen zurück</h2>
          <p>Spiel weiter, wo du aufgehört hast.</p>

          {errorMessage && <div className="sbb-field-error">{errorMessage}</div>}

          <form onSubmit={handleLogin} noValidate>
            <div className="sbb-field">
              <div className="sbb-field-label">
                <span className="label label--grey">Benutzername</span>
              </div>
              <input
                className="sbb-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ZürichHB_Master"
                autoComplete="username"
              />
            </div>

            <div className="sbb-field">
              <div className="sbb-field-label">
                <span className="label label--grey">Passwort</span>
              </div>
              <input
                className="sbb-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="sbb-btn sbb-btn--primary sbb-btn--lg sbb-btn--full"
              disabled={submitting}
            >
              {submitting ? "Anmelden…" : "Anmelden"}
            </button>
          </form>

          <p className="auth-right-footer">
            Kein Account?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--red)",
                cursor: "pointer",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                font: "inherit",
                padding: 0,
              }}
            >
              Registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
