"use client";

/**
 * Register Page – route: /register
 *
 * Design: GuesSBB v2 (Auth split-panel).
 *   Tokens:  --gs-* in globals.css :root
 *   Classes: .auth-* in globals.css (AUTH PAGES section)
 *
 * Logic untouched: useApi.post("/register"), then "/login" + useAuth().login,
 * then router.push(`/users/${userId}`).
 */

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { RegisterPostDTO, UserAuthDTO, LoginPostDTO } from "@/types/user";
import { Button, Form, Input } from "antd";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const SBBCross = ({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill={color} aria-hidden="true">
    <rect x="7" y="0" width="8" height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8" rx="1" />
  </svg>
);

const Register: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm<RegisterPostDTO>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegistration = async (values: RegisterPostDTO) => {
    values.isGuest = false;

    try {
      await apiService.post<UserAuthDTO>("/register", values);
      const loginCredentials: LoginPostDTO = {
        username: values.username,
        password: values.password,
      };
      const response = await apiService.post<UserAuthDTO>("/login", loginCredentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 400) {
        setErrorMessage("Registration failed: This username already exists.");
        console.log("Registration failed:", error);
      } else {
        console.log("An unexpected error occurred during Registration.", error);
      }
    }
  };

  return (
    <div className="auth-page">
      {/* ── LEFT: red brand hero ─────────────────────────────────────── */}
      <aside className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-hero-icon">
            <SBBCross size={28} />
          </div>
          <h1 className="auth-hero-title">Bereit für die Schweiz?</h1>
          <p className="auth-hero-text">
            Erstelle dein Konto und steig ein in die SBB-Liga.
          </p>
          <span className="auth-hero-tag">In 30 Sekunden dabei</span>
        </div>
      </aside>

      {/* ── RIGHT: form ──────────────────────────────────────────────── */}
      <main className="auth-form-side">
        <div className="auth-form-card">
          <span className="auth-eyebrow">Registrieren</span>
          <h2 className="auth-form-title">Create an account</h2>
          <p className="auth-form-subtitle">
            Earn points and climb the leaderboard.
          </p>

          {errorMessage && <div className="auth-form-error">{errorMessage}</div>}

          <Form
            form={form}
            name="register"
            size="large"
            variant="outlined"
            onFinish={handleRegistration}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please choose a username!" }]}
            >
              <Input placeholder="Pick a cool name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Please enter your email!" }]}
            >
              <Input placeholder="your@email.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter a password!" }]}
            >
              <Input.Password placeholder="Min. 6 characters" />
            </Form.Item>
            <Form.Item
              name="userBio"
              label={
                <span>
                  Bio <span className="auth-form-hint-optional">(OPTIONAL)</span>
                </span>
              }
            >
              <Input.TextArea
                placeholder="Tell us about yourself"
                rows={2}
                maxLength={200}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-submit-btn">
                Register & Play →
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form-footer">
            Already a member?{" "}
            <span className="auth-form-footer-link" onClick={() => router.push("/login")}>
              Log in
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
