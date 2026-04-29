import { useState, useEffect, useRef, useCallback } from "react";

// ─── constants ────────────────────────────────────────────────────
const DHAN  = "https://api.dhan.co/v2";
const LOT   = 65;
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');`;

// ─── api helpers ──────────────────────────────────────────────────
async function dhanReq(path, method = "GET", body = null, token) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "access-token": token },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${DHAN}${path}`, opts);
  if (!res.ok) throw new Error(`Dhan ${res.status}: ${await res.text()}`);
  return res.json();
}

async function callClaude(sys, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: sys,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text ?? "";
}

// ─── colours ─────────────────────────────────────────────────────
const C = {
  bg:     "#070b0f",
  panel:  "#0c1117",
  raised: "#111822",
  border: "#1a2332",
  accent: "#f0b429",
  green:  "#00e676",
  red:    "#ff4569",
  blue:   "#58a6ff",
  text:   "#cdd5df",
  muted:  "#5a6478",
  dimmed: "#8892a4",
};
const MONO    = "'JetBrains Mono', monospace";
const DISPLAY = "'Bebas Neue', 'Arial Narrow', sans-serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

// ─── helpers ──────────────────────────────────────────────────────
const fmtPts = n => n == null ? "--" : `${n > 0 ? "+" : ""}${n.toFixed(2)} pts`;
const nowStr = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtHM  = ts => { const d = new Date(ts * 1000); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

// ─── Candlestick SVG chart ────────────────────────────────────────
function CandlestickChart({ candles, pos }) {
  if (!candles || candles.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: C.muted }}>
        <div style={{ fontFamily: MONO, fontSize: 12 }}>No chart data</div>
        <div style={{ fontFamily: MONO, fontSize: 10 }}>Set Security ID in the position strip below, then connect</div>
      </div>
    );
  }

  const VW = 660, VH = 260;
  const volH = 42;
  const pad  = { t: 8, r: 56, b: 18, l: 2 };
  const priceH = VH - pad.t - pad.b - volH - 6;

  const bars = candles.slice(-70);
  const n    = bars.length;
  const cw   = (VW - pad.l - pad.r) / n;
  const bw   = Math.max(1, cw * 0.55);

  const highs  = bars.map(b => b.high);
  const lows   = bars.map(b => b.low);
  const spread = Math.max(...highs) - Math.min(...lows) || 1;
  const maxP   = Math.max(...highs) + spread * 0.04;
  const minP   = Math.min(...lows)  - spread * 0.04;
  const pRange = maxP - minP;

  const maxVol = Math.max(...bars.map(b => b.volume)) || 1;

  const py  = p => pad.t + priceH * (1 - (p - minP) / pRange);
  const bx  = i => pad.l + i * cw + cw / 2;
  const volY = v => VH - pad.b - (v / maxVol) * volH;

  // VWAP
  let cumPV = 0, cumV = 0;
  const vwap = bars.map(b => {
    const tp = (b.high + b.low + b.close) / 3;
    cumPV += tp * (b.volume || 1);
    cumV  += (b.volume || 1);
    return cumPV / cumV;
  });

  // Y grid
  const ySteps = 5;
  const yGrid  = Array.from({ length: ySteps + 1 }, (_, i) => {
    const p = minP + pRange * i / ySteps;
    return { p, y: py(p) };
  });

  // Levels from position
  const lvls = [
    { label: "Entry", price: parseFloat(pos.entryPrice), col: C.blue },
    { label: "SL",    price: parseFloat(pos.stopLoss),   col: C.red },
    { label: "T1",    price: parseFloat(pos.target1),    col: C.green },
    { label: "T2",    price: parseFloat(pos.target2),    col: "#00bfa5" },
  ].filter(l => l.price > 0 && l.price > minP && l.price < maxP);

  // X ticks
  const tickEvery = Math.max(1, Math.floor(n / 7));
  const xTicks    = bars.map((b, i) => i).filter(i => i % tickEvery === 0);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Y grid */}
      {yGrid.map(({ y }, i) => (
        <line key={i} x1={pad.l} y1={y} x2={VW - pad.r} y2={y}
          stroke={C.border} strokeWidth={0.5} strokeDasharray="3 4" />
      ))}
      {/* Y labels */}
      {yGrid.map(({ p, y }, i) => (
        <text key={i} x={VW - pad.r + 3} y={y + 4} fill={C.muted} fontSize={8} fontFamily={MONO}>{p.toFixed(0)}</text>
      ))}

      {/* Volume separator */}
      <line x1={pad.l} y1={VH - pad.b - volH} x2={VW - pad.r} y2={VH - pad.b - volH}
        stroke={C.border} strokeWidth={0.4} />

      {/* Volume bars */}
      {bars.map((b, i) => {
        const up = b.close >= b.open;
        const x  = bx(i);
        const ty = volY(b.volume);
        return <rect key={i} x={x - bw / 2} y={ty} width={bw} height={VH - pad.b - ty}
          fill={(up ? C.green : C.red) + "50"} />;
      })}

      {/* VWAP line */}
      {n > 1 && (
        <polyline
          points={vwap.map((v, i) => `${bx(i)},${py(v)}`).join(" ")}
          fill="none" stroke="#9c6fde" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.8} />
      )}

      {/* Price levels */}
      {lvls.map(l => {
        const y = py(l.price);
        return (
          <g key={l.label}>
            <line x1={pad.l} y1={y} x2={VW - pad.r} y2={y}
              stroke={l.col} strokeWidth={0.9} strokeDasharray="5 4" opacity={0.8} />
            <text x={VW - pad.r + 3} y={y + 4} fill={l.col} fontSize={8} fontFamily={MONO}>{l.label}</text>
          </g>
        );
      })}

      {/* Candles */}
      {bars.map((b, i) => {
        const up   = b.close >= b.open;
        const col  = up ? C.green : C.red;
        const x    = bx(i);
        const oY   = py(b.open), clY = py(b.close);
        const hiY  = py(b.high), loY = py(b.low);
        const top  = Math.min(oY, clY);
        const body = Math.max(1, Math.abs(oY - clY));
        return (
          <g key={i}>
            <line x1={x} y1={hiY} x2={x} y2={loY} stroke={col} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={body}
              fill={up ? col : "none"} stroke={col} strokeWidth={0.8} />
          </g>
        );
      })}

      {/* X ticks */}
      {xTicks.map(i => (
        <text key={i} x={bx(i)} y={VH - pad.b + 12} fill={C.muted}
          fontSize={8} fontFamily={MONO} textAnchor="middle">
          {fmtHM(bars[i].timestamp)}
        </text>
      ))}

      {/* Legend */}
      <g transform={`translate(${pad.l + 4}, ${pad.t + 5})`}>
        <circle cx={0} cy={0} r={3} fill="#9c6fde" />
        <text x={7} y={4} fill={C.muted} fontSize={8} fontFamily={MONO}>VWAP</text>
      </g>
    </svg>
  );
}

// ─── PANEL 1: Chart + position strip ─────────────────────────────
function ChartPanel({ candles, pos, setPos, ltp, pnl, loading, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0, padding: "4px 6px 0", display: "flex", flexDirection: "column" }}>
        {loading
          ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: MONO, fontSize: 11 }}>Loading chart…</div>
          : <CandlestickChart candles={candles} pos={pos} />
        }
      </div>

      {/* Position strip */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6, background: C.raised }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr", gap: 6 }}>
          {[
            { k: "symbol",     label: "SYMBOL", ph: "NIFTY25JUN24250CE" },
            { k: "securityId", label: "SEC ID",  ph: "35003" },
            { k: "entryPrice", label: "ENTRY",   ph: "24320" },
            { k: "stopLoss",   label: "SL",      ph: "24360" },
            { k: "target1",    label: "T1",      ph: "24250" },
            { k: "target2",    label: "T2",      ph: "24200" },
          ].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 2, fontFamily: MONO }}>{f.label}</div>
              <input value={pos[f.k] || ""} onChange={e => setPos(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph}
                style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "4px 6px", borderRadius: 3, fontFamily: MONO, fontSize: 10, boxSizing: "border-box", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["BUY","SELL"].map(s => (
            <button key={s} onClick={() => setPos(p => ({ ...p, side: s }))}
              style={{ padding: "3px 10px", background: pos.side === s ? (s === "BUY" ? "#061208" : "#120608") : C.bg, border: `1px solid ${pos.side === s ? (s === "BUY" ? C.green : C.red) : C.border}`, color: pos.side === s ? (s === "BUY" ? C.green : C.red) : C.muted, fontFamily: MONO, fontSize: 10, borderRadius: 3, cursor: "pointer" }}>
              {s}
            </button>
          ))}
          {["MIS","NRML"].map(t => (
            <button key={t} onClick={() => setPos(p => ({ ...p, productType: t }))}
              style={{ padding: "3px 10px", background: pos.productType === t ? C.raised : C.bg, border: `1px solid ${pos.productType === t ? C.dimmed : C.border}`, color: pos.productType === t ? C.text : C.muted, fontFamily: MONO, fontSize: 10, borderRadius: 3, cursor: "pointer" }}>
              {t}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {pnl != null && (
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: pnl >= 0 ? C.green : C.red }}>
              {ltp?.toFixed(2)} &nbsp;·&nbsp; {fmtPts(pnl)}
            </span>
          )}
          <button onClick={onRefresh}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "3px 9px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontFamily: MONO }}>
            ↻
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── shared ───────────────────────────────────────────────────────
function Panel({ title, badge, children }) {
  return (
    <div style={{ background: C.panel, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ background: C.raised, borderBottom: `1px solid ${C.border}`, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: DISPLAY, letterSpacing: 2, fontSize: 13, color: C.dimmed }}>{title}</span>
        {badge && <span style={{ fontFamily: MONO, fontSize: 10, padding: "1px 6px", borderRadius: 3, background: C.border, color: C.muted }}>{badge}</span>}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Inp({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ width: "100%" }}>
      {label && <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontFamily: MONO }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 9px", borderRadius: 4, fontFamily: MONO, fontSize: 11, boxSizing: "border-box", outline: "none" }}
        onFocus={e => (e.target.style.borderColor = C.accent)}
        onBlur={e => (e.target.style.borderColor = C.border)} />
    </div>
  );
}

function Seg({ options, value, onChange, colorMap }) {
  return (
    <div style={{ display: "flex", background: C.border, borderRadius: 4, overflow: "hidden" }}>
      {options.map(o => {
        const on  = value === o;
        const col = colorMap?.[o];
        return (
          <button key={o} onClick={() => onChange(o)}
            style={{ flex: 1, padding: "6px 0", background: on ? (col ? col + "22" : C.raised) : "transparent", border: "none", color: on ? (col || C.text) : C.muted, fontFamily: MONO, fontSize: 10, cursor: "pointer", borderBottom: `2px solid ${on ? (col || C.accent) : "transparent"}` }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ─── Settings modal ───────────────────────────────────────────────
function SettingsModal({ open, creds, onChange, onSave, canClose, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: 3, color: C.accent }}>DHAN CONNECT</div>
        <Inp label="Client ID" value={creds.clientId} onChange={v => onChange({ ...creds, clientId: v })} placeholder="1000000003" />
        <Inp label="Access Token" type="password" value={creds.accessToken} onChange={v => onChange({ ...creds, accessToken: v })} placeholder="eyJhbGci..." />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onSave}
            style={{ flex: 1, padding: "12px 0", background: C.accent, color: "#000", border: "none", borderRadius: 6, fontFamily: DISPLAY, fontSize: 18, letterSpacing: 2, cursor: "pointer" }}>
            CONNECT
          </button>
          {canClose && (
            <button onClick={onClose}
              style={{ padding: "12px 16px", background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, cursor: "pointer", fontFamily: MONO, fontSize: 12 }}>
              Cancel
            </button>
          )}
        </div>
        <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, lineHeight: 1.6, margin: 0 }}>
          Credentials stored in memory only — cleared on refresh.<br />
          Token: Dhan portal → My Profile → API Access.
        </p>
      </div>
    </div>
  );
}

function Toasts({ items }) {
  return (
    <div style={{ position: "fixed", top: 58, right: 14, zIndex: 800, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {items.map(t => (
        <div key={t.id} style={{ background: C.raised, border: `1px solid ${t.type === "error" ? C.red : t.type === "success" ? C.green : t.type === "warn" ? C.accent : C.blue}`, padding: "8px 14px", borderRadius: 6, fontFamily: MONO, fontSize: 11, color: C.text, maxWidth: 290 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function ActionBanner({ action, onConfirm, onDismiss }) {
  if (!action) return null;
  return (
    <div style={{ background: "#100d00", borderBottom: `2px solid ${C.accent}`, padding: "9px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, color: C.accent, fontWeight: 700 }}>⚡ CLAUDE →</span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{action.label}</span>
      <div style={{ flex: 1 }} />
      {!action.manualOnly && (
        <button onClick={onConfirm}
          style={{ background: C.accent, color: "#000", border: "none", padding: "6px 18px", borderRadius: 4, cursor: "pointer", fontFamily: DISPLAY, fontSize: 14, letterSpacing: 1 }}>
          CONFIRM ORDER
        </button>
      )}
      <button onClick={onDismiss}
        style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontFamily: MONO, fontSize: 11 }}>
        Dismiss
      </button>
    </div>
  );
}

// ─── PANEL 2: Order entry ─────────────────────────────────────────
function OrderPanel({ form, setForm, onPlace }) {
  const resolved = form.expiry && form.strike
    ? `NIFTY${form.expiry.toUpperCase()}${form.strike}${form.optionType}` : "";
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto" }}>
      <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, padding: 11, display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>OPTION SELECTOR</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 72px", gap: 8 }}>
          <Inp label="EXPIRY (DDMONYY)" value={form.expiry} onChange={v => setForm(f => ({ ...f, expiry: v.toUpperCase() }))} placeholder="25JUN25" />
          <Inp label="STRIKE" value={form.strike} onChange={v => setForm(f => ({ ...f, strike: v }))} placeholder="24250" />
          <div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontFamily: MONO }}>TYPE</div>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {["CE","PE"].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, optionType: t }))}
                  style={{ flex: 1, padding: "5px 0", background: form.optionType === t ? (t === "CE" ? "#061208" : "#120608") : C.bg, border: "none", color: form.optionType === t ? (t === "CE" ? C.green : C.red) : C.muted, fontFamily: MONO, fontSize: 11, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        {resolved && <div style={{ fontFamily: MONO, fontSize: 12, color: C.accent, padding: "4px 8px", background: C.bg, borderRadius: 4 }}>{resolved}</div>}
        <Inp label="SECURITY ID" value={form.securityId} onChange={v => setForm(f => ({ ...f, securityId: v, symbol: resolved }))} placeholder="Look up in Dhan scrip master CSV" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {["BUY","SELL"].map(s => (
          <button key={s} onClick={() => setForm(f => ({ ...f, side: s }))}
            style={{ padding: "13px 0", background: form.side === s ? (s === "BUY" ? "#061208" : "#120608") : C.panel, border: "none", color: form.side === s ? (s === "BUY" ? C.green : C.red) : C.muted, fontFamily: DISPLAY, fontSize: 20, letterSpacing: 3, cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: MONO }}>ORDER TYPE</div>
          <Seg options={["MARKET","LIMIT"]} value={form.orderType} onChange={v => setForm(f => ({ ...f, orderType: v }))} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: MONO }}>PRODUCT</div>
          <Seg options={["MIS","NRML"]} value={form.productType} onChange={v => setForm(f => ({ ...f, productType: v }))} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, fontFamily: MONO }}>LOTS (1 lot = {LOT} qty)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {[-1,1].map((d, i) => (
            <button key={i} onClick={() => setForm(f => ({ ...f, lots: Math.max(1, f.lots + d) }))}
              style={{ width: 34, height: 34, background: C.raised, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, cursor: "pointer", fontSize: 18 }}>
              {d > 0 ? "+" : "−"}
            </button>
          ))}
          <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, flex: 1, textAlign: "center" }}>{form.lots}</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{form.lots * LOT} qty</span>
        </div>
      </div>

      {form.orderType === "LIMIT" && (
        <Inp label="LIMIT PRICE" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="Enter price" />
      )}

      <button onClick={onPlace} disabled={!form.securityId}
        style={{ padding: "15px 0", background: !form.securityId ? C.raised : form.side === "BUY" ? C.green : C.red, border: "none", color: !form.securityId ? C.muted : "#000", fontFamily: DISPLAY, fontSize: 20, letterSpacing: 3, cursor: form.securityId ? "pointer" : "not-allowed", borderRadius: 6 }}>
        {form.side} {form.lots} LOT{form.lots > 1 ? "S" : ""}
      </button>
    </div>
  );
}

// ─── PANEL 3: Orders ──────────────────────────────────────────────
function OrdersPanel({ orders, tab, setTab, onCancel, onRefresh }) {
  const tCol = { active: C.green, pending: C.accent, closed: C.muted };
  const rows = orders[tab] || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {["active","pending","closed"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: "8px 0", background: tab === t ? C.raised : "transparent", border: "none", borderBottom: `2px solid ${tab === t ? tCol[t] : "transparent"}`, color: tab === t ? tCol[t] : C.muted, fontFamily: MONO, fontSize: 10, cursor: "pointer", textTransform: "uppercase" }}>
            {t} ({(orders[t] || []).length})
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontFamily: MONO, fontSize: 12 }}>No {tab} orders</div>
          : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: MONO }}>
              <thead style={{ position: "sticky", top: 0, background: C.raised }}>
                <tr>{["Symbol","Type","Qty","Price","Status",""].map(h => (
                  <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: C.muted, fontWeight: 400, borderBottom: `1px solid ${C.border}`, fontSize: 10 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 8px", color: o.transactionType === "BUY" ? C.green : C.red, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.tradingSymbol || o.securityId}</td>
                    <td style={{ padding: "6px 8px", color: C.dimmed }}>{o.orderType}</td>
                    <td style={{ padding: "6px 8px" }}>{o.quantity}</td>
                    <td style={{ padding: "6px 8px" }}>{o.price > 0 ? o.price : "MKT"}</td>
                    <td style={{ padding: "6px 8px", color: o.orderStatus === "TRADED" ? C.green : C.muted, fontSize: 10 }}>{o.orderStatus}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {tab === "pending" && (
                        <button onClick={() => onCancel(o.orderId)}
                          style={{ background: "none", border: `1px solid ${C.red}`, color: C.red, padding: "2px 8px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontFamily: MONO }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onRefresh}
          style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontFamily: MONO }}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

// ─── PANEL 4: Claude analysis ─────────────────────────────────────
function AnalysisPanel({ analysis, log, countdown, analyzing, onNow, hasPosition }) {
  const ac = tag => {
    if (!tag) return C.muted;
    if (tag === "HOLD") return C.green;
    if (tag.includes("EXIT")) return C.red;
    return C.accent;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: analyzing ? C.accent : hasPosition ? C.green : C.muted, animation: analyzing ? "pulse 1s infinite" : "none" }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            {analyzing ? "Analyzing…" : hasPosition ? `Next in ${countdown}s` : "Set position to enable"}
          </span>
        </div>
        <div style={{ width: 60, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${(countdown / 90) * 100}%`, height: "100%", background: countdown < 15 ? C.red : C.accent, transition: "width 1s linear" }} />
        </div>
        <button onClick={onNow} disabled={analyzing || !hasPosition}
          style={{ background: "none", border: `1px solid ${analyzing || !hasPosition ? C.border : C.accent}`, color: analyzing || !hasPosition ? C.muted : C.accent, padding: "3px 10px", borderRadius: 4, cursor: analyzing || !hasPosition ? "not-allowed" : "pointer", fontSize: 11, fontFamily: MONO }}>
          Now
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {!analysis
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80%", gap: 12, color: C.muted }}>
              <div style={{ fontSize: 36 }}>🤖</div>
              <span style={{ fontFamily: MONO, fontSize: 11, textAlign: "center", lineHeight: 1.7 }}>
                Fill position strip in Panel 1<br />analysis fires every 90s automatically
              </span>
            </div>
          : <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{analysis.ts} · LTP {analysis.ltp?.toFixed(2)}</span>
                {analysis.tag && (
                  <span style={{ fontFamily: MONO, fontSize: 10, padding: "2px 9px", borderRadius: 3, background: ac(analysis.tag) + "22", color: ac(analysis.tag), border: `1px solid ${ac(analysis.tag)}44` }}>
                    {analysis.tag.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: C.text, whiteSpace: "pre-wrap" }}>
                {analysis.text.replace(/\[ACTION:[^\]]+\]/g, "").trim()}
              </div>
              {log.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>PREVIOUS</div>
                  {log.slice(1, 5).map((a, i) => (
                    <div key={i} style={{ padding: "7px 10px", background: C.raised, borderRadius: 5, marginBottom: 6, borderLeft: `3px solid ${ac(a.tag)}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{a.ts}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: ac(a.tag) }}>{a.tag}</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmed, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {a.text.substring(0, 120)}…
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
        }
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function TradingDashboard() {
  const [creds, setCreds]           = useState({ clientId: "", accessToken: "" });
  const [tempCreds, setTempCreds]   = useState({ clientId: "", accessToken: "" });
  const [settingsOpen, setSettings] = useState(true);

  const [candles, setCandles]         = useState([]);
  const [chartLoading, setChartLoad]  = useState(false);
  const [ltp, setLtp]                 = useState(null);
  const ltpSamples                    = useRef([]);

  const [pos, setPos] = useState({
    symbol: "", securityId: "", side: "BUY",
    entryPrice: "", stopLoss: "", target1: "", target2: "",
    productType: "MIS",
  });
  const [form, setForm] = useState({
    expiry: "", strike: "", optionType: "CE",
    side: "BUY", orderType: "MARKET", productType: "MIS",
    lots: 1, price: "", securityId: "", symbol: "",
  });
  const [orders, setOrders]       = useState({ active: [], pending: [], closed: [] });
  const [ordersTab, setOrdersTab] = useState("active");
  const [analysis, setAnalysis]   = useState(null);
  const [analysisLog, setLog]     = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(90);
  const [pending, setPending]     = useState(null);
  const [toasts, setToasts]       = useState([]);

  // Stable refs
  const posRef   = useRef(pos);
  const ltpRef   = useRef(ltp);
  const credsRef = useRef(creds);
  const formRef  = useRef(form);
  useEffect(() => { posRef.current   = pos;   }, [pos]);
  useEffect(() => { ltpRef.current   = ltp;   }, [ltp]);
  useEffect(() => { credsRef.current = creds; }, [creds]);
  useEffect(() => { formRef.current  = form;  }, [form]);

  const toast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  const fetchChart = useCallback(async (secId, token) => {
    if (!secId || !token) return;
    setChartLoad(true);
    try {
      const d = await dhanReq("/charts/intraday", "POST", {
        securityId:      String(secId),
        exchangeSegment: "NSE_FNO",
        instrument:      "OPTIDX",
        interval:        "1",
        oi:              false,
      }, token);
      const { open = [], high = [], low = [], close = [], volume = [], start_Time = [], timestamp = [] } = d;
      const ts = start_Time.length ? start_Time : timestamp;
      const bars = open.map((o, i) => ({
        open: o, high: high[i], low: low[i], close: close[i],
        volume: volume[i] || 0, timestamp: ts[i] || 0,
      })).filter(b => b.high > 0);
      setCandles(bars);
    } catch (e) { toast("error", `Chart: ${e.message}`); }
    setChartLoad(false);
  }, [toast]);

  const fetchLTP = useCallback(async () => {
    const { accessToken } = credsRef.current;
    const sid = posRef.current.securityId || formRef.current.securityId;
    if (!accessToken || !sid) return;
    try {
      const d = await dhanReq("/marketfeed/ltp", "POST", { NSE_FNO: [parseInt(sid)] }, accessToken);
      const price = d?.data?.NSE_FNO?.[sid]?.last_price ?? d?.data?.NSE_FNO?.[parseInt(sid)]?.last_price;
      if (price) {
        setLtp(price);
        ltpSamples.current = [...ltpSamples.current, { t: Date.now(), p: price }].slice(-600);
      }
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    const { accessToken } = credsRef.current;
    if (!accessToken) return;
    try {
      const data = await dhanReq("/orders", "GET", null, accessToken);
      const all = Array.isArray(data) ? data : [];
      setOrders({
        active:  all.filter(o => o.orderStatus === "TRADED"),
        pending: all.filter(o => ["PENDING","TRANSIT","PART_TRADED"].includes(o.orderStatus)),
        closed:  all.filter(o => ["CANCELLED","REJECTED","EXPIRED"].includes(o.orderStatus)),
      });
    } catch {}
  }, []);

  const buildBars = () => {
    const s = ltpSamples.current;
    if (s.length < 3) return [];
    const barMs = 90_000, t0 = s[0].t;
    const map = {};
    s.forEach(({ t, p }) => {
      const k = Math.floor((t - t0) / barMs);
      if (!map[k]) map[k] = { o: p, h: p, l: p, c: p, n: 1 };
      else { map[k].h = Math.max(map[k].h, p); map[k].l = Math.min(map[k].l, p); map[k].c = p; map[k].n++; }
    });
    return Object.values(map).slice(-6);
  };

  const runAnalysis = useCallback(async () => {
    const p = posRef.current, cur = ltpRef.current;
    if (!p.entryPrice || !cur) return;
    setAnalyzing(true);
    try {
      const bars  = buildBars();
      const entry = parseFloat(p.entryPrice);
      const pnl   = p.side === "BUY" ? cur - entry : entry - cur;
      const sys = `You are a professional Nifty 50 options trader. Analyse the live position and give a decisive structured recommendation.
Format as "Hold vs Exit — Live Read" with: summary header, bar table if available, situation analysis (VWAP, volume patterns, key levels), clear recommendation with exact price levels, one-line bottom line.
End on a new line with exactly one: [ACTION:HOLD] [ACTION:EXIT_FULL] [ACTION:EXIT_HALF] [ACTION:TRAIL_STOP] [ACTION:NONE]`;
      const user = `POSITION: ${p.side} ${p.symbol||"Nifty Option"} | Entry:${entry} Current:${cur} P&L:${pnl.toFixed(2)}pts | SL:${p.stopLoss||"—"} T1:${p.target1||"—"} T2:${p.target2||"—"} | ${LOT}qty (1 lot)
${bars.length>1?`90-SEC BARS:\n${bars.map((b,i)=>`Bar${i+1}: O:${b.o.toFixed(2)} H:${b.h.toFixed(2)} L:${b.l.toFixed(2)} C:${b.c.toFixed(2)} N:${b.n}`).join("\n")`:"BARS: accumulating…"}`;
      const raw = await callClaude(sys, user);
      const m   = raw.match(/\[ACTION:([^\]]+)\]/);
      const tag = m ? m[1] : "NONE";
      const ent = { ts: nowStr(), text: raw, tag, ltp: cur };
      setAnalysis(ent);
      setLog(prev => [ent, ...prev].slice(0, 8));
      if (tag && tag !== "HOLD" && tag !== "NONE") {
        const exitSide = p.side === "BUY" ? "SELL" : "BUY";
        let action = null;
        if (tag === "EXIT_FULL")  action = { label: "Exit Full Position (Market)",    form: { side: exitSide, orderType: "MARKET", productType: p.productType, lots: 1, securityId: p.securityId, symbol: p.symbol } };
        if (tag === "EXIT_HALF")  action = { label: "Partial Exit — 50% (Market)",    form: { side: exitSide, orderType: "MARKET", productType: p.productType, lots: 1, securityId: p.securityId, symbol: p.symbol } };
        if (tag === "TRAIL_STOP") action = { label: "Trail stop — update SL in Panel 1", manualOnly: true };
        if (action) {
          setPending(action);
          if (action.form) setForm(f => ({ ...f, ...action.form }));
          toast("warn", `⚡ Claude: ${action.label}`);
        }
      }
    } catch (e) { toast("error", `Analysis: ${e.message}`); }
    setAnalyzing(false);
  }, [toast]);

  const runRef = useRef(runAnalysis); useEffect(() => { runRef.current = runAnalysis; }, [runAnalysis]);
  const ordRef = useRef(fetchOrders); useEffect(() => { ordRef.current = fetchOrders; }, [fetchOrders]);
  const ltpFn  = useRef(fetchLTP);   useEffect(() => { ltpFn.current  = fetchLTP;    }, [fetchLTP]);
  const chFn   = useRef(fetchChart); useEffect(() => { chFn.current   = fetchChart;  }, [fetchChart]);

  useEffect(() => {
    if (!creds.accessToken) return;
    ordRef.current();
    const sid = pos.securityId || form.securityId;
    if (sid) chFn.current(sid, creds.accessToken);
    const lTimer = setInterval(() => ltpFn.current(), 5000);
    let cd = 90;
    const cTimer = setInterval(() => {
      cd--; setCountdown(cd);
      if (cd <= 0) {
        cd = 90;
        runRef.current(); ordRef.current();
        const s = posRef.current.securityId || formRef.current.securityId;
        if (s) chFn.current(s, credsRef.current.accessToken);
      }
    }, 1000);
    return () => { clearInterval(lTimer); clearInterval(cTimer); };
  }, [creds.accessToken]); // eslint-disable-line

  useEffect(() => {
    if (creds.accessToken && pos.securityId) fetchChart(pos.securityId, creds.accessToken);
  }, [pos.securityId, creds.accessToken, fetchChart]);

  const placeOrder = async (ov = {}) => {
    if (!creds.accessToken) { toast("error", "Set credentials first"); return; }
    const f = { ...form, ...ov };
    try {
      const payload = {
        dhanClientId: creds.clientId, transactionType: f.side,
        exchangeSegment: "NSE_FNO",
        productType: f.productType === "MIS" ? "INTRADAY" : "MARGIN",
        orderType: f.orderType, validity: "DAY",
        securityId: f.securityId, quantity: (f.lots || 1) * LOT,
        disclosedQuantity: 0, price: f.orderType === "LIMIT" ? parseFloat(f.price) || 0 : 0,
        triggerPrice: 0, afterMarketOrder: false,
      };
      const res = await dhanReq("/orders", "POST", payload, creds.accessToken);
      toast("success", `Order placed ✓ ${res.orderId}`);
      setPending(null); fetchOrders();
    } catch (e) { toast("error", `Order failed: ${e.message}`); }
  };

  const cancelOrder = async id => {
    try { await dhanReq(`/orders/${id}`, "DELETE", null, creds.accessToken); toast("success", "Cancelled"); fetchOrders(); }
    catch (e) { toast("error", `Cancel: ${e.message}`); }
  };

  const pnl = pos.entryPrice && ltp
    ? (pos.side === "BUY" ? ltp - parseFloat(pos.entryPrice) : parseFloat(pos.entryPrice) - ltp) : null;

  return (
    <div style={{ background: C.bg, height: "100vh", fontFamily: BODY, color: C.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{FONTS + `
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        input,button{outline:none}
      `}</style>

      {/* Navbar */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 14, height: 46, flexShrink: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: 3, color: C.accent }}>NIFTY DESK</span>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>NSE FNO · 1 lot = {LOT} qty · Dhan v2</span>
        <div style={{ flex: 1 }} />
        {ltp && (
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: pnl > 0 ? C.green : pnl < 0 ? C.red : C.text }}>
            {ltp.toFixed(2)}
            {pnl != null && <span style={{ fontSize: 11, marginLeft: 8, color: pnl >= 0 ? C.green : C.red }}>{fmtPts(pnl)}</span>}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: creds.accessToken ? C.green : C.muted, boxShadow: creds.accessToken ? `0 0 7px ${C.green}` : "none" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{creds.accessToken ? "LIVE" : "OFFLINE"}</span>
        </div>
        <button onClick={() => { setTempCreds(creds); setSettings(true); }}
          style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontFamily: MONO, fontSize: 11 }}>
          ⚙ Settings
        </button>
      </div>

      <ActionBanner action={pending} onConfirm={() => placeOrder(pending.form)} onDismiss={() => setPending(null)} />

      {/* 4-panel grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 1, background: C.border, minHeight: 0 }}>
        <Panel title="CHART · 1MIN · NSE FNO" badge="Panel 1">
          <ChartPanel candles={candles} pos={pos} setPos={setPos} ltp={ltp} pnl={pnl} loading={chartLoading}
            onRefresh={() => { const s = pos.securityId||form.securityId; if (s && creds.accessToken) fetchChart(s, creds.accessToken); }} />
        </Panel>
        <Panel title="ORDER ENTRY" badge="Panel 2">
          <OrderPanel form={form} setForm={setForm} onPlace={() => placeOrder()} />
        </Panel>
        <Panel title="ORDERS" badge={`${orders.active.length + orders.pending.length} open`}>
          <OrdersPanel orders={orders} tab={ordersTab} setTab={setOrdersTab} onCancel={cancelOrder} onRefresh={fetchOrders} />
        </Panel>
        <Panel title="CLAUDE ANALYSIS" badge="90s">
          <AnalysisPanel analysis={analysis} log={analysisLog} countdown={countdown} analyzing={analyzing} onNow={runAnalysis} hasPosition={!!pos.entryPrice} />
        </Panel>
      </div>

      <SettingsModal open={settingsOpen} creds={tempCreds} onChange={setTempCreds} onSave={() => { setCreds(tempCreds); setSettings(false); toast("success", "Connected"); }} canClose={!!creds.accessToken} onClose={() => setSettings(false)} />
      <Toasts items={toasts} />
    </div>
  );
}
