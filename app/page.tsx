"use client";

/**
 * Home Page – route: /
 *
 * Design: GuesSBB v2 (HomePage redesign).
 *   Fonts:   Space Grotesk + IBM Plex Mono (loaded via @import in globals.css)
 *   Tokens:  --gs-* in globals.css :root
 *   Classes: .home-* in globals.css §14 (HOME PAGE v2)
 *
 * Logic untouched (Stark's domain):
 *   - useRouter from next/navigation
 *   - useLocalStorage from @/hooks/useLocalStorage
 *   - handlePlay → router.push("/lobbies")
 *
 * Tiny logic addition (flagged in handover): inline
 * onClick={() => router.push("/register")} on the secondary hero button.
 * Same pattern as the previous design used for the leaderboard button.
 */

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";

// ─── SVG: SBB-style horizontal train (decorative) ───────────────────────────
const TrainSVG = ({ width = 150 }: { width?: number }) => (
  <svg
    viewBox="0 0 180 90"
    width={width}
    fill="none"
    aria-hidden="true"
    className="home-train-svg"
  >
    <rect x="6" y="20" width="160" height="46" rx="5" fill="#EB0000" />
    <rect x="6" y="54" width="160" height="10" fill="#B80000" opacity="0.5" />
    {[14, 40, 66, 92, 118, 142].map((x, i) => (
      <rect key={i} x={x} y="28" width="18" height="14" rx="2" fill="#FFFFFF" opacity="0.93" />
    ))}
    <rect x="82" y="20" width="3" height="46" fill="#B80000" opacity="0.3" />
    {[28, 90, 152].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="76" r="9" fill="#2C2825" />
        <circle cx={x} cy="76" r="5" fill="#C8C3BC" />
        <circle cx={x} cy="76" r="2.5" fill="#2C2825" />
      </g>
    ))}
    <rect x="0" y="83" width="180" height="3" rx="1.5" fill="#2C2825" opacity="0.18" />
    <path
      d="M100 20 L94 7 M100 20 L106 7 M94 7 L106 7"
      stroke="#2C2825"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.45"
    />
    <text
      x="46"
      y="52"
      fill="#FFFFFF"
      fontSize="9"
      fontFamily="IBM Plex Mono, monospace"
      fontWeight="700"
      opacity="0.75"
    >
      SBB · CFF · FFS
    </text>
  </svg>
);

// ─── SVG: Mountain silhouette band ──────────────────────────────────────────
const MtnSVG = () => (
  <svg
    viewBox="0 0 900 110"
    preserveAspectRatio="none"
    width="100%"
    height="110"
    fill="none"
    aria-hidden="true"
    className="home-mtn-svg"
  >
    <path
      d="M0 110 L0 70 L70 28 L105 52 L170 8 L235 48 L295 22 L355 62 L415 18 L490 58 L540 28 L605 66 L665 22 L730 55 L800 28 L860 62 L900 42 L900 110Z"
      fill="#EB0000"
      opacity="0.06"
    />
    <path
      d="M0 110 L0 82 L90 50 L130 68 L195 36 L260 62 L320 44 L380 72 L440 40 L510 68 L570 46 L635 72 L700 50 L760 68 L840 52 L900 62 L900 110Z"
      fill="#EB0000"
      opacity="0.04"
    />
    {[
      [170, 8],
      [415, 18],
      [665, 22],
    ].map(([x, y], i) => (
      <path
        key={i}
        d={`M${x} ${y} L${x - 12} ${y + 18} L${x + 12} ${y + 18}Z`}
        fill="#FFFFFF"
        opacity="0.7"
      />
    ))}
  </svg>
);

// ─── Static content ─────────────────────────────────────────────────────────
const TICKER =
  "  🚆 GuesSBB — Wo ist der Zug?  ·  IC 1 Genève → St.Gallen  ·  S12 Brugg → Zürich HB  ·  IR 13 Zürich → Chur  ·  RE Basel → Luzern  ·  IC 5 Lausanne → Zürich  ·  ";

const STEPS = [
  {
    n: "01",
    title: "Zuginfo lesen",
    body: "Linie, Von, Nach und die aktuelle Uhrzeit. Kein Fahrplan erlaubt!",
  },
  {
    n: "02",
    title: "Auf die Karte klicken",
    body: "Klicke auf die Schweizer Karte dort, wo du den Zug vermutest.",
  },
  {
    n: "03",
    title: "Punkte kassieren",
    body: "Je näher du liegst, desto mehr Punkte. 5 Runden, dann die Abrechnung.",
  },
];

const STATS: Array<[string, string]> = [
  ["2’847", "Spiele heute"],
  ["342", "Online"],
  ["12’504", "Züge geraten"],
  ["ZürichHB", "#1 Weltweit"],
];

// ─── Page ───────────────────────────────────────────────────────────────────
const MainPage: React.FC = () => {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");

  const handlePlay = () => {
    router.push("/lobbies");
  };

  return (
    <div className="home-root">
      {/* ── Ticker (black bar) ──────────────────────────────────────────── */}
      <div className="home-ticker" aria-hidden="true">
        <div className="home-ticker-track">
          <span>{TICKER}</span>
          <span>{TICKER}</span>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <span className="home-hero-eyebrow">DAS SCHWEIZER BAHN-RATESPIEL</span>

          <div className="home-hero-train">
            <TrainSVG />
          </div>

          <h1 className="home-hero-title">
            Gues<span className="home-hero-title-accent">SBB</span>
          </h1>

          <p className="home-hero-tagline">Wo zum Teufel ist der Zug gerade?</p>

          <p className="home-hero-subtitle">
            <span className="home-hero-subtitle-full">
              ECHTZEIT-POSITION RATEN  ·  PUNKTE SAMMELN  ·  FREUNDE BESIEGEN
            </span>
            <span className="home-hero-subtitle-short">
              RATEN · PUNKTE · FREUNDE BESIEGEN
            </span>
          </p>

          <div className="home-hero-actions">
            <button
              type="button"
              className="home-btn home-btn--primary"
              onClick={handlePlay}
            >
              ▶ JETZT SPIELEN
            </button>
            <button
              type="button"
              className="home-btn home-btn--secondary"
              onClick={() => router.push("/register")}
            >
              KONTO ERSTELLEN
            </button>
          </div>
        </div>
      </section>

      {/* ── Mountain transition ─────────────────────────────────────────── */}
      <div className="home-mountains" aria-hidden="true">
        <MtnSVG />
      </div>

      {/* ── How-to-play (black) ─────────────────────────────────────────── */}
      <section className="home-howto">
        <div className="home-howto-inner">
          <div className="home-howto-header">
            <span className="home-howto-label">SPIELANLEITUNG</span>
            <h2 className="home-howto-title">Drei Schritte. Einfach.</h2>
          </div>
          <div className="home-howto-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="home-howto-card">
                <div className="home-howto-card-num">{s.n}</div>
                <div className="home-howto-card-title">{s.title}</div>
                <div className="home-howto-card-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar (red) ─────────────────────────────────────────────── */}
      <section className="home-stats">
        <div className="home-stats-inner">
          {STATS.map(([value, label]) => (
            <div key={label} className="home-stat">
              <div className="home-stat-value">{value}</div>
              <div className="home-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MainPage;