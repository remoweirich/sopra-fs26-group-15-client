"use client";

/**
 * Main Page  –  route: /
 *
 * Design ref: /01-home.html prototype
 * Classnames used (all defined in globals.css):
 *   page-root, page-cards-row, page-section, page-hero-actions
 *   card, card--wide
 *   btn-outline-red
 *   home-hero-*, home-step-*, home-stats-*
 */

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "antd";

// ─── SVG Illustrations (inline, decorative only) ────────────────────────────
const PinIcon = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 24 30" fill="none" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18C24 5.37 18.63 0 12 0z" fill="#E30613" />
    <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="2.5" fill="#E30613" />
  </svg>
);

const TrainIllustration = () => (
  <svg viewBox="0 0 120 80" fill="none" aria-hidden="true" className="home-hero-train">
    <rect x="10" y="20" width="100" height="40" rx="8" fill="#E30613" />
    <rect x="14" y="26" width="22" height="16" rx="4" fill="#FFFFFF" opacity="0.9" />
    <rect x="42" y="26" width="22" height="16" rx="4" fill="#FFFFFF" opacity="0.9" />
    <rect x="70" y="26" width="22" height="16" rx="4" fill="#FFFFFF" opacity="0.9" />
    <rect x="96" y="30" width="12" height="8" rx="2" fill="#FFFFFF" opacity="0.6" />
    <circle cx="30" cy="64" r="6" fill="#2D2D2D" />
    <circle cx="30" cy="64" r="3" fill="#C4C4C4" />
    <circle cx="80" cy="64" r="6" fill="#2D2D2D" />
    <circle cx="80" cy="64" r="3" fill="#C4C4C4" />
    <rect x="5" y="58" width="110" height="4" rx="2" fill="#2D2D2D" />
    <path d="M2 16L10 20" stroke="#E30613" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 10L10 22" stroke="#E30613" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MountainScene = () => (
  <svg viewBox="0 0 600 140" fill="none" aria-hidden="true" className="home-hero-mountains" preserveAspectRatio="none">
    <path d="M0 140L80 50L120 80L200 20L280 70L340 30L420 60L500 10L560 50L600 30V140H0Z" fill="#E30613" opacity="0.06" />
    <path d="M0 140L60 80L100 100L180 50L260 90L320 60L400 80L480 40L540 70L600 50V140H0Z" fill="#E30613" opacity="0.04" />
    <circle cx="520" cy="30" r="20" fill="#E8B927" opacity="0.15" />
  </svg>
);

// ─── Page ───────────────────────────────────────────────────────────────────
const MainPage: React.FC = () => {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");

  const handlePlay = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/lobbies");
    }
  };

  return (
    <div className="page-root">

      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <section className="home-hero">
        <MountainScene />

        <div className="home-hero-content">
          <div className="home-hero-illustration">
            <PinIcon size={64} />
            <TrainIllustration />
          </div>

          <h1 className="home-hero-title">
            Gues<span className="u-text-red">SBB</span>
          </h1>

          <p className="home-hero-tagline">Where is the train right now?</p>

          <p className="home-hero-description">
            Guess in real time where SBB trains are on the Swiss rail network. 
            Play against friends or the world. Who gets closest?
          </p>

          <div className="page-hero-actions">
            <Button type="primary" size="large" onClick={handlePlay}>
              ▶ Play now
            </Button>

            <Button
              size="large"
              className="btn-outline-red"
              onClick={() => router.push("/leaderboard")}
            >
              Leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* ── How-it-works cards ────────────────────────────────────────────── */}
      <section className="page-cards-row">
        <div className="card home-step-card">
          <div className="home-step-emoji-bg">🚂</div>
          <div className="home-step-emoji">🚂</div>
          <div className="home-step-number home-step-number--red">01</div>
          <div className="home-step-title">Read the train info</div>
          <div className="home-step-desc">
            You see the line, departure, and arrival of a real SBB train.
          </div>
        </div>

        <div className="card home-step-card">
          <div className="home-step-emoji-bg">📍</div>
          <div className="home-step-emoji">📍</div>
          <div className="home-step-number home-step-number--gold">02</div>
          <div className="home-step-title">Position guess</div>
          <div className="home-step-desc">
            Click on the Swiss map. The closer you are to the real position,
            the more points you get!
          </div>
        </div>

        <div className="card home-step-card">
          <div className="home-step-emoji-bg">🏆</div>
          <div className="home-step-emoji">🏆</div>
          <div className="home-step-number home-step-number--green">03</div>
          <div className="home-step-title">Collect points</div>
          <div className="home-step-desc">
            After each round you see the result. Become the best guesser of
            Switzerland!
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="page-section">
        <div className="card card--wide home-stats-bar">
          <div className="home-stat">
            <div className="home-stat-emoji">🎮</div>
            <div className="home-stat-value">2&apos;847</div>
            <div className="home-stat-label">Games today</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">👥</div>
            <div className="home-stat-value">342</div>
            <div className="home-stat-label">Players online</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">🗺️</div>
            <div className="home-stat-value">12&apos;504</div>
            <div className="home-stat-label">Trains guessed</div>
          </div>

          <div className="home-stat">
            <div className="home-stat-emoji">🏅</div>
            <div className="home-stat-value home-stat-value--small">ZürichHB_Master</div>
            <div className="home-stat-label">#1 worldwide</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MainPage;