"use client";

import { useEffect, useState } from "react";

/**
 * TrainLoader  —  full-screen SBB train animation
 * Used as the loading state between joining a lobby and entering a round.
 * The train traverses the screen on a dashed track with rotating wheels
 * and steam puffs.
 *
 * After `timeoutMs` (default 12s) a "server reagiert nicht" hint appears
 * so the user has a clear signal rather than an infinite spinner.
 */

interface TrainLoaderProps {
  readonly label?: string;
  readonly timeoutMs?: number;
}

const TrainLoader: React.FC<TrainLoaderProps> = ({ label = "Lade Fahrplan", timeoutMs = 12000 }) => {
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStalled(true), timeoutMs);
    return () => clearTimeout(t);
  }, [timeoutMs]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--parch)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        overflow: "hidden",
        zIndex: 99,
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <svg width={36} height={36} viewBox="0 0 22 22" fill="var(--red)" aria-hidden="true">
            <rect x="7" y="0" width="8" height="22" rx="1" />
            <rect x="0" y="7" width="22" height="8" rx="1" />
          </svg>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "-0.04em",
              color: "var(--black)",
              margin: 0,
              lineHeight: 1,
            }}
          >
            Gues<span style={{ color: "var(--red)" }}>SBB</span>
          </h1>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--grey)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginTop: 6,
          }}
        >
          Das Schweizer Bahn-Ratespiel
        </div>
      </div>

      {/* Train scene — spans the full viewport so the train can come in
          from off-screen left, cross the whole screen, exit off-screen
          right, and loop. Width is 100vw rather than the parent's box
          so the animation isn't constrained to a 560px strip. */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: 120,
          overflow: "hidden",
        }}
      >
        {/* Track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 14,
            height: 2,
            background:
              "repeating-linear-gradient(90deg, var(--black) 0 7px, transparent 7px 12px)",
            opacity: 0.35,
            animation: "trackDash 0.4s linear infinite",
          }}
        />
        {/* Train traveling across */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 0,
            animation: "trainJourney 3.6s cubic-bezier(.42,0,.58,1) infinite",
          }}
        >
          <div style={{ animation: "trainBounce 0.3s ease-in-out infinite", position: "relative" }}>
            <svg viewBox="0 0 180 90" width={160} fill="none" style={{ display: "block" }}>
              {/* Body */}
              <rect x="6" y="20" width="160" height="46" rx="5" fill="#EB0000" />
              <rect x="6" y="54" width="160" height="10" fill="#A30000" opacity="0.5" />
              {/* Windows */}
              {[14, 40, 66, 92, 118, 142].map((x, i) => (
                <rect key={i} x={x} y="28" width="18" height="14" rx="2" fill="#fff" opacity="0.93" />
              ))}
              <text
                x="46"
                y="52"
                fill="#fff"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                opacity="0.75"
              >
                SBB · CFF · FFS
              </text>
              {/* Pantograph */}
              <path
                d="M100 20 L94 7 M100 20 L106 7 M94 7 L106 7"
                stroke="#1C1917"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.45"
              />
              {/* Wheels with SMIL rotation */}
              {[28, 90, 152].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="76" r="9" fill="#1C1917" />
                  <circle cx={cx} cy="76" r="5.5" fill="#C8C3BC" />
                  <line x1={cx - 5} y1="76" x2={cx + 5} y2="76" stroke="#1C1917" strokeWidth="1.4" />
                  <line x1={cx} y1="71" x2={cx} y2="81" stroke="#1C1917" strokeWidth="1.4" />
                  <circle cx={cx} cy="76" r="2.5" fill="#1C1917" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${cx} 76`}
                    to={`360 ${cx} 76`}
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </g>
              ))}
              {/* Track shadow */}
              <rect x="0" y="83" width="180" height="3" rx="1.5" fill="#1C1917" opacity="0.18" />
            </svg>
            {/* Steam puffs */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: -4,
                  left: 84,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: `rgba(140,130,120,${0.45 - i * 0.1})`,
                  filter: "blur(1px)",
                  opacity: 0,
                  animation: `steamPuff 1.4s ease-out ${i * 0.32}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status label */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: stalled ? "var(--red)" : "var(--grey-l)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          display: "flex",
          gap: 1,
          zIndex: 2,
        }}
      >
        <span>{label}</span>
        <span style={{ display: "inline-block", animation: "loadingDots 1.4s ease-in-out 0s infinite", marginLeft: 2 }}>.</span>
        <span style={{ display: "inline-block", animation: "loadingDots 1.4s ease-in-out 0.2s infinite" }}>.</span>
        <span style={{ display: "inline-block", animation: "loadingDots 1.4s ease-in-out 0.4s infinite" }}>.</span>
      </div>

      {/* Stalled hint — appears after `timeoutMs` so the user knows the
          backend isn't responding rather than staring at an infinite loop. */}
      {stalled && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--charcoal)",
            textAlign: "center",
            maxWidth: 360,
            padding: "0 24px",
            lineHeight: 1.55,
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Server reagiert nicht.
          </div>
          <div style={{ color: "var(--grey)", fontSize: 12 }}>
            Browser-Konsole öffnen für Details, oder Seite neu laden.
          </div>
        </div>
      )}

      <style>{`
        /* Train enters from off-screen left, traverses the entire viewport,
           and exits off-screen right. Loops continuously. */
        @keyframes trainJourney {
          0%   { transform: translateX(-200px); }
          100% { transform: translateX(100vw); }
        }
        @keyframes trainBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1.5px); }
        }
        @keyframes steamPuff {
          0%   { transform: translate(0, 0) scale(0.7); opacity: 0; }
          25%  { opacity: 0.6; }
          100% { transform: translate(-22px, -26px) scale(1.4); opacity: 0; }
        }
        @keyframes trackDash {
          from { background-position: 0 0; }
          to   { background-position: -12px 0; }
        }
        @keyframes loadingDots {
          0%, 80%, 100% { opacity: 0.25; }
          40%           { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TrainLoader;
