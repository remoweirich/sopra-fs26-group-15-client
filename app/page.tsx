"use client";

import { useRouter } from "next/navigation";

// ─── Decorative SVGs ────────────────────────────────────────────────────────
const TrainSVG = ({ w = 150 }: { w?: number }) => (
  <svg viewBox="0 0 180 90" width={w} fill="none" style={{ display: "block" }}>
    <rect x="6" y="20" width="160" height="46" rx="5" fill="#EB0000" />
    <rect x="6" y="54" width="160" height="10" fill="#B80000" opacity="0.5" />
    {[14, 40, 66, 92, 118, 142].map((x, i) => (
      <rect key={i} x={x} y="28" width="18" height="14" rx="2" fill="#FFFFFF" opacity="0.93" />
    ))}
    <rect x="82" y="20" width="3" height="46" fill="#B80000" opacity="0.3" />
    {[28, 90, 152].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="76" r="9" fill="#1C1917" />
        <circle cx={x} cy="76" r="5" fill="#C8C3BC" />
        <circle cx={x} cy="76" r="2.5" fill="#1C1917" />
      </g>
    ))}
    <rect x="0" y="83" width="180" height="3" rx="1.5" fill="#1C1917" opacity="0.18" />
    <path d="M100 20 L94 7 M100 20 L106 7 M94 7 L106 7" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    <text x="46" y="52" fill="#FFFFFF" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700" opacity="0.75">
      SBB · CFF · FFS
    </text>
  </svg>
);

const MountainSVG = () => (
  <svg viewBox="0 0 900 110" preserveAspectRatio="none" width="100%" height="110" fill="none">
    <path
      d="M0 110 L0 70 L70 28 L105 52 L170 8 L235 48 L295 22 L355 62 L415 18 L490 58 L540 28 L605 66 L665 22 L730 55 L800 28 L860 62 L900 42 L900 110Z"
      fill="#EB0000" opacity="0.06"
    />
    <path
      d="M0 110 L0 82 L90 50 L130 68 L195 36 L260 62 L320 44 L380 72 L440 40 L510 68 L570 46 L635 72 L700 50 L760 68 L840 52 L900 62 L900 110Z"
      fill="#EB0000" opacity="0.04"
    />
    {[[170, 8], [415, 18], [665, 22]].map(([x, y], i) => (
      <path key={i} d={`M${x} ${y} L${x - 12} ${y + 18} L${x + 12} ${y + 18}Z`} fill="#FFFFFF" opacity="0.7" />
    ))}
  </svg>
);

const HomePage: React.FC = () => {
  const router = useRouter();
  const ticker =
    "  🚄 GuesSBB – Wo ist der Zug?  ·  IC 1 Genève → St.Gallen  ·  S12 Brugg → Zürich HB  ·  IR 13 Zürich → Chur  ·  RE Basel → Luzern  ·  IC 5 Lausanne → Zürich  ·  ";

  return (
    <div className="home-root">
      {/* Ticker */}
      <div className="home-ticker">
        <div className="home-ticker-track">
          <span>{ticker}</span>
          <span>{ticker}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-badge">DAS SCHWEIZER BAHN-RATESPIEL</div>

          <div className="home-hero-train">
            <TrainSVG w={150} />
          </div>

          <h1 className="home-hero-title">
            Gues<span className="u-text-red">SBB</span>
          </h1>

          <p className="home-hero-tagline">Wo zum Teufel ist der Zug gerade?</p>

          <p className="home-hero-sub">
            ECHTZEIT-POSITION RATEN · PUNKTE SAMMELN · FREUNDE BESIEGEN
          </p>

          <div className="home-hero-actions">
            <button
              className="sbb-btn sbb-btn--primary sbb-btn--lg"
              onClick={() => router.push("/lobbies")}
              type="button"
            >
              ▶ Jetzt spielen
            </button>
            <button
              className="sbb-btn sbb-btn--secondary sbb-btn--lg"
              onClick={() => router.push("/register")}
              type="button"
            >
              Konto erstellen
            </button>
          </div>
        </div>
      </div>

      {/* Mountains as visual transition */}
      <div className="home-mtn-band">
        <MountainSVG />
      </div>

      {/* How to play */}
      <div className="home-steps">
        <div className="home-steps-head">
          <span className="label">Spielanleitung</span>
          <h2>Drei Schritte. Einfach.</h2>
        </div>
        <div className="home-steps-grid">
          <div className="home-step-card">
            <div className="home-step-num">01</div>
            <div className="home-step-title">Zuginfo lesen</div>
            <div className="home-step-desc">
              Linie, Von, Nach und die aktuelle Uhrzeit. Kein Fahrplan erlaubt!
            </div>
          </div>
          <div className="home-step-card">
            <div className="home-step-num">02</div>
            <div className="home-step-title">Auf die Karte klicken</div>
            <div className="home-step-desc">
              Klicke auf die Schweizer Karte dort, wo du den Zug vermutest.
            </div>
          </div>
          <div className="home-step-card">
            <div className="home-step-num">03</div>
            <div className="home-step-title">Punkte kassieren</div>
            <div className="home-step-desc">
              Je näher du liegst, desto mehr Punkte. 5 Runden, dann die Abrechnung.
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="home-stats">
        <div className="home-stats-bar">
          <div className="home-stat">
            <div className="home-stat-v">2&apos;847</div>
            <div className="home-stat-l">Spiele heute</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-v">342</div>
            <div className="home-stat-l">Online</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-v">12&apos;504</div>
            <div className="home-stat-l">Züge geraten</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-v">ZürichHB</div>
            <div className="home-stat-l">#1 Weltweit</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
