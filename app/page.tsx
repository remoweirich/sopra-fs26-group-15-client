"use client";

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";

const TICKER_TEXT =
  "  🚆 GuesSBB — Wo ist der Zug?  ·  IC 1 Genève → St.Gallen  ·  S12 Brugg → Zürich HB  ·  IR 13 Zürich → Chur  ·  RE Basel → Luzern  ·  IC 5 Lausanne → Zürich  ·  ";

const STEPS = [
  { n: "01", title: "Zuginfo lesen",         body: "Linie, Von, Nach und die aktuelle Uhrzeit. Kein Fahrplan erlaubt!" },
  { n: "02", title: "Auf die Karte klicken", body: "Klicke auf die Schweizer Karte dort, wo du den Zug vermutest." },
  { n: "03", title: "Punkte kassieren",      body: "Je näher du liegst, desto mehr Punkte. 5 Runden, dann die Abrechnung." },
] as const;

const STATS: ReadonlyArray<readonly [string, string]> = [
  ["2'847",    "Spiele heute"],
  ["342",      "Online"],
  ["12'504",   "Züge geraten"],
  ["ZürichHB", "#1 Weltweit"],
];

/* ── SVGs ─────────────────────────────────────────────────────────────────
 * Sized via CSS (.gs-hero-train-wrap svg, .gs-mountains svg). Colors stay
 * inline because they're part of the artwork, not the theme.
 * ───────────────────────────────────────────────────────────────────────── */

const TrainSVG = () => (
  <svg viewBox="0 0 180 90" fill="none" aria-hidden="true">
    <rect x="6" y="20" width="160" height="46" rx="5" fill="#EB0000" />
    <rect x="6" y="54" width="160" height="10" fill="#B80000" opacity="0.5" />
    {[14, 40, 66, 92, 118, 142].map((x, i) => (
      <rect key={i} x={x} y="28" width="18" height="14" rx="2" fill="#FFFFFF" opacity="0.93" />
    ))}
    <rect x="82" y="20" width="3" height="46" fill="#B80000" opacity="0.3" />
    {[28, 90, 152].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="76" r="9"   fill="#2C2825" />
        <circle cx={x} cy="76" r="5"   fill="#C8C3BC" />
        <circle cx={x} cy="76" r="2.5" fill="#2C2825" />
      </g>
    ))}
    <rect x="0" y="83" width="180" height="3" rx="1.5" fill="#2C2825" opacity="0.18" />
    <path
      d="M100 20 L94 7 M100 20 L106 7 M94 7 L106 7"
      stroke="#2C2825" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"
    />
    <text x="46" y="52" fill="#FFFFFF" fontSize="9" fontFamily="IBM Plex Mono,monospace" fontWeight="700" opacity="0.75">
      SBB · CFF · FFS
    </text>
  </svg>
);

const MtnSVG = () => (
  <svg viewBox="0 0 900 110" preserveAspectRatio="none" height="110" fill="none" aria-hidden="true">
    <path
      d="M0 110 L0 70 L70 28 L105 52 L170 8 L235 48 L295 22 L355 62 L415 18 L490 58 L540 28 L605 66 L665 22 L730 55 L800 28 L860 62 L900 42 L900 110Z"
      fill="#EB0000" opacity="0.06"
    />
    <path
      d="M0 110 L0 82 L90 50 L130 68 L195 36 L260 62 L320 44 L380 72 L440 40 L510 68 L570 46 L635 72 L700 50 L760 68 L840 52 L900 62 L900 110Z"
      fill="#EB0000" opacity="0.04"
    />
    {([[170, 8], [415, 18], [665, 22]] as const).map(([x, y], i) => (
      <path
        key={i}
        d={`M${x} ${y} L${x - 12} ${y + 18} L${x + 12} ${y + 18}Z`}
        fill="#FFFFFF" opacity="0.7"
      />
    ))}
  </svg>
);

const MainPage: React.FC = () => {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const isLoggedIn = !!token;

  return (
    <div className="gs-home">
      {/* Ticker */}
      <div className="gs-ticker">
        <div className="gs-ticker-track">
          {[TICKER_TEXT, TICKER_TEXT].map((t, i) => (
            <span key={i} className="gs-ticker-text">{t}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="gs-hero">
        <div className="gs-hero-inner">
          <div className="gs-hero-badge">DAS SCHWEIZER BAHN-RATESPIEL</div>

          <div className="gs-hero-train-wrap"><TrainSVG /></div>

          <h1 className="homepage-hero-title">
            Gues<span className="gs-text-red">SBB</span>
          </h1>

          <p className="gs-hero-tagline">Wo zum Teufel ist der Zug gerade?</p>

          <p className="gs-hero-mono">
            <span className="full">ECHTZEIT-POSITION RATEN  ·  PUNKTE SAMMELN  ·  FREUNDE BESIEGEN</span>
            <span className="short">RATEN · PUNKTE · FREUNDE BESIEGEN</span>
          </p>

          <div className="gs-hero-cta-row">
            <button
              className="sbb-btn-home sbb-btn-home--primary"
              onClick={() => router.push("/lobbies")}
            >
              ▶ JETZT SPIELEN
            </button>
            <button
              className="sbb-btn-home sbb-btn-home--secondary"
              onClick={() => router.push(isLoggedIn ? "/leaderboard" : "/register")}
            >
              {isLoggedIn ? "LEADERBOARD" : "KONTO ERSTELLEN"}
            </button>
          </div>
        </div>
      </section>

      {/* Mountains transition */}
      <div className="gs-mountains"><MtnSVG /></div>

      {/* How-to-play */}
      <section className="gs-howto">
        <div className="gs-howto-inner">
          <div className="gs-howto-header">
            <span className="eyebrow eyebrow--red">Spielanleitung</span>
            <h2 className="gs-howto-title">Drei Schritte. Einfach.</h2>
          </div>
          <div className="gs-howto-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="gs-howto-card">
                <div className="gs-howto-num">{s.n}</div>
                <div className="gs-howto-step-title">{s.title}</div>
                <div className="gs-howto-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="gs-statbar">
        <div className="gs-statbar-row">
          {STATS.map(([v, l]) => (
            <div key={l} className="gs-stat">
              <div className="gs-stat-value">{v}</div>
              <div className="gs-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;