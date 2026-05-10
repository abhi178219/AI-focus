import { useState, useEffect, lazy, Suspense } from "react";

const NiftyDesk   = lazy(() => import("../nifty-desk.jsx"));
const TradingBrain = lazy(() => import("./TradingBrain.jsx"));

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:     "#0a0d0f",
  panel:  "#0f1417",
  border: "#1a2228",
  gold:   "#c9a227",
  purple: "#a67ff0",
  muted:  "#3a5060",
  text:   "#c4cdd6",
};

const TABS = [
  { id: "brain",     label: "TRADING BRAIN", color: C.purple },
  { id: "dashboard", label: "MAIN DASHBOARD", color: C.gold   },
];

function Clock() {
  const [t, setT] = useState(() =>
    new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
  );
  useEffect(() => {
    const id = setInterval(() =>
      setT(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.muted }}>{t} IST</span>;
}

export default function App() {
  const [tab, setTab] = useState("brain");

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: C.bg, fontFamily: "'JetBrains Mono', monospace", color: C.text,
      overflow: "hidden",
    }}>
      {/* ── Google Fonts ── */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "0 16px", height: 38,
        background: C.panel, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <span style={{ fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: "0.12em" }}>
          NIFTY DESK
        </span>

        <div style={{ width: 1, height: 16, background: C.border }} />

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? color + "18" : "none",
                border: `1px solid ${tab === id ? color : "transparent"}`,
                color: tab === id ? color : C.muted,
                padding: "2px 14px", borderRadius: 3,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: clock */}
        <div style={{ marginLeft: "auto" }}>
          <Clock />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <Suspense fallback={
          <div style={{
            height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", color: C.muted, fontSize: 11,
          }}>
            Loading…
          </div>
        }>
          {tab === "brain"     && <TradingBrain />}
          {tab === "dashboard" && <NiftyDesk />}
        </Suspense>
      </div>
    </div>
  );
}
