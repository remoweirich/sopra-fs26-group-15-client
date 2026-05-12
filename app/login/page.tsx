"use client";

/**
 * Login Page – route: /login
 *
 * Design: GuesSBB v2 (Auth split-panel).
 *   Tokens:  --gs-* in globals.css :root
 *   Classes: .auth-* in globals.css (AUTH PAGES section)
 *
 * Logic untouched: useApi.post("/login"), useAuth().login(token, userId),
 * router.push(`/users/${userId}`).
 */

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Button, Form, Input } from "antd";
import { UserAuthDTO, LoginPostDTO } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

// SBB cross icon for the brand panel
const SBBCross = ({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill={color} aria-hidden="true">
    <rect x="7" y="0" width="8" height="22" rx="1" />
    <rect x="0" y="7" width="22" height="8" rx="1" />
  </svg>
);

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (values: LoginPostDTO) => {
    try {
      const loginCredentials: LoginPostDTO = {
        username: values.username,
        password: values.password,
      };
      const response = await apiService.post<UserAuthDTO>("/login", loginCredentials);
      await login(response.token, response.userId);
      router.push(`/users/${response.userId}`);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 404) {
        setErrorMessage("Login failed: User not found.");
        console.error("Login failed:", error);
      } else if (err?.status === 401) {
        setErrorMessage("Login failed: Wrong username or password.");
        console.error("Login failed:", error);
      } else {
        console.log("An unexpected error occurred during Login.", error);
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
          <h1 className="auth-hero-title">Willkommen zurück!</h1>
          <p className="auth-hero-text">
            Logg dich ein und beweise, dass du die Schweizer Strecken kennst.
          </p>
          <span className="auth-hero-tag">Das Schweizer Bahn-Ratespiel</span>
        </div>
      </aside>

      {/* ── RIGHT: form ──────────────────────────────────────────────── */}
      <main className="auth-form-side">
        <div className="auth-form-card">
          <span className="auth-eyebrow">Anmelden</span>
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-subtitle">Sign in to keep playing.</p>

          {errorMessage && <div className="auth-form-error">{errorMessage}</div>}

          <Form
            form={form}
            name="login"
            size="large"
            variant="outlined"
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please enter your username!" }]}
            >
              <Input placeholder="Your username" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter your password!" }]}
            >
              <Input.Password placeholder="Your password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-submit-btn">
                Log in →
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form-footer">
            Don&apos;t have an account?{" "}
            <span className="auth-form-footer-link" onClick={() => router.push("/register")}>
              Sign up
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
