"use client";

/**
 * Main Page  –  route: /
 *
 * Design ref: image1.png
 * ─────────────────────────────────────────────────────────────────────────────
 * Classnames used (all defined in globals.css):
 *   page-root, page-content
 *   card, card--wide
 *   form-title, u-text-muted, u-divider
 *   badge-open, badge-ingame
 *   btn-full, btn-outline-red
 *
 * 
 */

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card } from "antd";

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
      {/*
        .page-center-all      centres all children horizontally and adds vertical padding.
        .page-hero-actions  lays the two CTA buttons out side-by-side with a gap.
        btn-full is NOT used here – buttons size to their content inside the row.
      */}
      <section className="page-center-all">
        {/* TODO: GuesSBB front-page Bild + Beschreibung */}
       

        <div className="page-hero-actions">
          <Button
            type="primary"
            size="large"
            onClick={handlePlay}
          >
            Jetzt spielen
          </Button>

          <Button
            size="large"
            className="btn-outline-red"
            onClick={() => router.push("/leaderboard")}
          >
            Leaderboard
          </Button>
        </div>
      </section>

      {/* ── How-to-play cards ─────────────────────────────────────────────── */}
      {/*
        .page-cards-row is a CSS grid: 3 equal columns on desktop, 1 on mobile.
        Each direct child <div className="card"> automatically fills one cell.
        TODO: replace placeholder divs with concrete card components.
      */}
      <section className="page-cards-row">
        <div className="card">{/* Step 01 – Zug-Info lesen */}
          <Card title="Card 1">Card 1</Card>
        </div>
        <div className="card">{/* Step 02 – Position raten */}</div>
        <div className="card">{/* Step 03 – Punkte sammeln */}</div>
      </section>

      {/* ── Global stats row ──────────────────────────────────────────────── */}
      {/*
        .page-section centres its children up to 900px wide.
        .card--wide constrains the stats card to 720px inside that.
        4 stats in a horizontal row: games played · players · guesses · top station.
        TODO: fetch from GET /stats and wire values.
      */}
      <div className="page-section">
        <div className="card card--wide">
          {/* stat cells */}
        </div>
      </div>

    </div>
  );
};

export default MainPage;