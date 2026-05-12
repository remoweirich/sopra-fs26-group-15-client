"use client";

import React from "react";

type LoadingScreenProps = {
  label?: string;
  fullscreen?: boolean;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  label = "Lade Fahrplan",
  fullscreen = true,
}) => {
  return (
    <div
      className={`gs-loader ${fullscreen ? "gs-loader--fullscreen" : ""}`}
      aria-label={label}
      role="status"
    >
      <div className="gs-loader__content">
        <div className="gs-loader__logo">
          <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="0" y="9" width="24" height="6" fill="#EB0000" />
            <rect x="9" y="0" width="6" height="24" fill="#EB0000" />
          </svg>
          <h1 className="gs-loader__title">
            Gues<span>SBB</span>
          </h1>
        </div>

        <div className="gs-loader__tagline">Das Schweizer Bahn-Ratespiel</div>

        <div className="gs-loader__scene">
          <div className="gs-loader__train">
            <svg viewBox="0 0 180 90" width="160" fill="none" aria-hidden="true">
              <rect x="6" y="20" width="160" height="46" rx="5" fill="#EB0000" />
              <rect x="6" y="54" width="160" height="10" fill="#A30000" opacity="0.5" />

              <g fill="#fff" opacity="0.93">
                <rect x="14" y="28" width="18" height="14" rx="2" />
                <rect x="40" y="28" width="18" height="14" rx="2" />
                <rect x="66" y="28" width="18" height="14" rx="2" />
                <rect x="92" y="28" width="18" height="14" rx="2" />
                <rect x="118" y="28" width="18" height="14" rx="2" />
                <rect x="142" y="28" width="18" height="14" rx="2" />
              </g>

              <text
                x="46"
                y="52"
                fill="#fff"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight="700"
                opacity="0.75"
              >
                SBB · CFF · FFS
              </text>

              <path
                d="M100 20 L94 7 M100 20 L106 7 M94 7 L106 7"
                stroke="#1C1917"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.45"
              />

              <g className="gs-loader__wheel-spin" style={{ transformOrigin: "28px 76px" }}>
                <circle cx="28" cy="76" r="9" fill="#1C1917" />
                <circle cx="28" cy="76" r="5.5" fill="#C8C3BC" />
                <line x1="23" y1="76" x2="33" y2="76" stroke="#1C1917" strokeWidth="1.4" />
                <line x1="28" y1="71" x2="28" y2="81" stroke="#1C1917" strokeWidth="1.4" />
                <circle cx="28" cy="76" r="2.5" fill="#1C1917" />
              </g>

              <g className="gs-loader__wheel-spin" style={{ transformOrigin: "90px 76px" }}>
                <circle cx="90" cy="76" r="9" fill="#1C1917" />
                <circle cx="90" cy="76" r="5.5" fill="#C8C3BC" />
                <line x1="85" y1="76" x2="95" y2="76" stroke="#1C1917" strokeWidth="1.4" />
                <line x1="90" y1="71" x2="90" y2="81" stroke="#1C1917" strokeWidth="1.4" />
                <circle cx="90" cy="76" r="2.5" fill="#1C1917" />
              </g>

              <g className="gs-loader__wheel-spin" style={{ transformOrigin: "152px 76px" }}>
                <circle cx="152" cy="76" r="9" fill="#1C1917" />
                <circle cx="152" cy="76" r="5.5" fill="#C8C3BC" />
                <line x1="147" y1="76" x2="157" y2="76" stroke="#1C1917" strokeWidth="1.4" />
                <line x1="152" y1="71" x2="152" y2="81" stroke="#1C1917" strokeWidth="1.4" />
                <circle cx="152" cy="76" r="2.5" fill="#1C1917" />
              </g>

              <rect x="0" y="83" width="180" height="3" rx="1.5" fill="#1C1917" opacity="0.18" />
            </svg>

            <span className="gs-loader__steam gs-loader__steam--1" />
            <span className="gs-loader__steam gs-loader__steam--2" />
            <span className="gs-loader__steam gs-loader__steam--3" />
          </div>

          <div className="gs-loader__tracks" />
        </div>

        <div className="gs-loader__status">
          <span>{label}</span>
          <span className="gs-loader__dot">.</span>
          <span className="gs-loader__dot">.</span>
          <span className="gs-loader__dot">.</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;