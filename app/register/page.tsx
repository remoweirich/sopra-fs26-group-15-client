"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { RegisterPostDTO, UserAuthDTO, LoginPostDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { useState, FormEvent } from "react";

const SBBCross = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="#fff" aria-hidden="true">
    <rect x="7" y="0" width="8" height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8" rx="1" />
  </svg>
);

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userBio, setUserBio] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage("Bitte fülle alle Pflichtfelder aus.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    const values: RegisterPostDTO = {
      username: username.trim(),
      email: email.trim(),
      password,
      userBio: userBio.trim() || null,
      isGuest: false,
    };

    setSubmitting(true);
    try {
      await apiService.post<UserAuthDTO>("/register", values);
      const credentials: LoginPostDTO = { username: values.username, password: values.password };
      const response = await apiService.post<UserAuthDTO>("/login", credentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      const message = (error as Error)?.message ?? "";

      if (status === 400) {
        if (message.includes("username and the email")) {
          setErrorMessage("Benutzername und E-Mail sind bereits vergeben.");
        } else if (message.includes("username")) {
          setErrorMessage("Dieser Benutzername ist bereits vergeben.");
        } else if (message.includes("email")) {
          setErrorMessage("Diese E-Mail-Adresse ist bereits vergeben.");
        } else {
          setErrorMessage("Registrierung fehlgeschlagen.");
        }
      } else {
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-icon">
            <SBBCross size={34} />
          </div>
          <h1>Bereit für die Schweiz?</h1>
          <p>Erstelle dein Konto und steig ein in die SBB-Liga.</p>
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

      <div className="auth-right">
        <div className="auth-right-content">
          <span className="label">Registrieren</span>
          <h2>Konto erstellen</h2>
          <p>In 30 Sekunden bist du dabei.</p>

          {errorMessage && <div className="sbb-field-error">{errorMessage}</div>}

          <form onSubmit={handleRegistration} noValidate>
            <div className="sbb-field">
              <div className="sbb-field-label">
                <span className="label label--grey">Benutzername</span>
              </div>
              <input
                className="sbb-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Pick a cool name"
                autoComplete="username"
              />
            </div>

            <div className="sbb-field">
              <div className="sbb-field-label">
                <span className="label label--grey">E-Mail</span>
              </div>
              <input
                className="sbb-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="zug@sbb.ch"
                autoComplete="email"
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
                placeholder="Min. 6 Zeichen"
                autoComplete="new-password"
              />
            </div>

            <div className="sbb-field">
              <div className="sbb-field-label">
                <span className="label label--grey">Bio</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--grey-l)", letterSpacing: "0.08em" }}>
                  (OPTIONAL)
                </span>
              </div>
              <textarea
                className="sbb-input sbb-textarea"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value.slice(0, 200))}
                placeholder="Passionierter Bahnfan aus Zürich..."
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="sbb-btn sbb-btn--primary sbb-btn--lg sbb-btn--full"
              disabled={submitting}
            >
              {submitting ? "Registriere…" : "Konto erstellen"}
            </button>
          </form>

          <p className="auth-right-footer">
            Bereits registriert?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
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
              Anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
