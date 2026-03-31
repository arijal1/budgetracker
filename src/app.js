import { useState, useEffect } from “react”;

// ─── CONFIG PANEL ───────────────────────────────────────────
function ConfigPanel({ onConnect }) {
const [sheetId, setSheetId] = useState(””);
const [apiKey, setApiKey] = useState(””);
const [error, setError] = useState(””);
const [loading, setLoading] = useState(false);

const connect = async () => {
if (!sheetId.trim() || !apiKey.trim()) { setError(“Both fields are required.”); return; }
setError(””); setLoading(true);
try {
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Transactions!A1:F1?key=${apiKey}`;
const res = await fetch(url);
const json = await res.json();
if (json.error) { setError(`Google API error: ${json.error.message}`); setLoading(false); return; }
onConnect(sheetId, apiKey);
} catch (e) {
setError(“Could not reach the Sheets API. Check your Sheet ID and API key.”);
}
setLoading(false);
};

return (
<div style={{ fontFamily:”‘DM Mono’,‘Courier New’,monospace”, background:”#0a0f1a”,
minHeight:“100vh”, display:“flex”, alignItems:“center”, justifyContent:“center”, padding:24 }}>
<div style={{ background:”#0f172a”, border:“1px solid #1e293b”, borderRadius:16, padding:32, width:“100%”, maxWidth:420 }}>
<div style={{ display:“flex”, alignItems:“center”, gap:10, marginBottom:6 }}>
<span style={{ fontSize:22 }}>💰</span>
<span style={{ fontSize:11, color:”#4ade80”, letterSpacing:3, textTransform:“uppercase”, fontWeight:“bold” }}>Budget Tracker Pro</span>
</div>
<h2 style={{ color:“white”, margin:“0 0 6px”, fontFamily:”‘Georgia’,serif”, fontSize:22 }}>Connect your Sheet</h2>
<p style={{ color:”#475569”, fontSize:11, margin:“0 0 24px”, lineHeight:1.6 }}>
Enter your Google Sheet ID and API key to load your live budget data.
</p>

```
    <label style={labelStyle}>Google Sheet ID</label>
    <input style={inputStyle} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      value={sheetId} onChange={e => setSheetId(e.target.value)} />
    <p style={hintStyle}>From your Sheet URL: /spreadsheets/d/<span style={{ color:"#4ade80" }}>SHEET_ID</span>/edit</p>

    <label style={{ ...labelStyle, marginTop:16 }}>Google API Key</label>
    <input style={inputStyle} placeholder="AIzaSy..." type="password"
      value={apiKey} onChange={e => setApiKey(e.target.value)} />
    <p style={hintStyle}>console.cloud.google.com → Enable Sheets API → Credentials → API Key</p>

    {error && <p style={{ color:"#f87171", fontSize:11, marginTop:12 }}>⚠ {error}</p>}

    <button onClick={connect} disabled={loading} style={{
      marginTop:20, width:"100%", padding:"12px", background:loading?"#1e293b":"#4ade80",
      color:loading?"#475569":"#0a0f1a", border:"none", borderRadius:8, fontSize:13,
      fontWeight:"bold", cursor:loading?"default":"pointer", fontFamily:"inherit", letterSpacing:1
    }}>
      {loading ? "Connecting…" : "→ Connect"}
    </button>

    <div style={{ marginTop:24, padding:14, background:"#0a0f1a", borderRadius:8, border:"1px solid #1e293b" }}>
      <p style={{ color:"#fbbf24", fontSize:10, letterSpacing:2, margin:"0 0 8px" }}>⚡ QUICK SETUP</p>
      <ol style={{ color:"#475569", fontSize:11, margin:0, paddingLeft:16, lineHeight:1.9 }}>
        <li>Open your Budget Tracker Google Sheet</li>
        <li>Click <b style={{ color:"#94a3b8" }}>Share → Anyone with link → Viewer</b></li>
        <li>Copy the Sheet ID from the URL</li>
        <li>Get a free API key from Google Cloud Console</li>
        <li>Paste both above and click Connect</li>
      </ol>
    </div>
  </div>
</div>
```

);
}

const labelStyle = { display:“block”, fontSize:11, color:”#94a3b8”, letterSpacing:2, textTransform:“uppercase”, marginBottom:6 };
const inputStyle = { width:“100%”, background:”#0a0f1a”, border:“1px solid #1e293b”, borderRadius:8,
color:“white”, padding:“10px 12px”, fontSize:12, fontFamily:”‘DM Mono’,‘Courier New’,monospace”,
boxSizing:“border-box”, outline:“none” };
const hintStyle = { color:”#334155”, fontSize:10, margin:“4px 0 0”, lineHeight:1.5 };

// ─── DATA FETCHER ────────────────────────────────────────────
async function fetchSheetData(sheetId, apiKey) {
const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;
const [txnRes, settingsRes] = await Promise.all([
fetch(`${base}/Transactions!A2:F1000?key=${apiKey}`).then(r => r.json()),
fetch(`${base}/Settings!A3:B6?key=${apiKey}`).then(r => r.json()),
]);

const rows = txnRes.values || [];
const settings = {};
(settingsRes.values || []).forEach(([k, v]) => { settings[k] = v; });

const currentMonth = settings[“Month/Year”] || “”;
const currency = settings[“Currency Symbol”] || “$”;

let income = 0, expenses = 0;
const catExpense = {}, catIncome = {};
const transactions = [];

rows.forEach(row => {
const [date, type, cat, desc, amt, month] = row;
const amount = parseFloat(amt) || 0;
if (!amount) return;
const inMonth = !currentMonth || month === currentMonth;
if (!inMonth) return;
transactions.push({ date, type, cat, desc, amount });
if (type === “Income”) { income += amount; catIncome[cat] = (catIncome[cat] || 0) + amount; }
else if (type === “Expense”) { expenses += amount; catExpense[cat] = (catExpense[cat] || 0) + amount; }
});

return { income, expenses, catExpense, catIncome, transactions, currentMonth, currency };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────
const CAT_COLORS = [”#4ade80”,”#f87171”,”#60a5fa”,”#fbbf24”,”#a78bfa”,”#34d399”,”#fb923c”,”#e879f9”,”#2dd4bf”,”#f472b6”];

function AnimatedNumber({ value, prefix = “$” }) {
const [display, setDisplay] = useState(0);
useEffect(() => {
const duration = 1100, start = performance.now();
const tick = now => {
const p = Math.min((now - start) / duration, 1);
setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
if (p < 1) requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
}, [value]);
return <>{prefix}{display.toLocaleString()}</>;
}

function ProgressBar({ pct, color = “#4ade80”, delay = 0 }) {
const [w, setW] = useState(0);
useEffect(() => { const t = setTimeout(() => setW(Math.min(pct, 100)), delay + 200); return () => clearTimeout(t); }, [pct, delay]);
return (
<div style={{ background:”#1e293b”, borderRadius:4, height:5, overflow:“hidden” }}>
<div style={{ width:`${w}%`, height:“100%”, background:color, borderRadius:4,
transition:“width 0.8s cubic-bezier(0.34,1.56,0.64,1)”, boxShadow:`0 0 8px ${color}60` }} />
</div>
);
}

function DonutChart({ slices, total }) {
const [hovered, setHovered] = useState(null);
const size = 150, cx = 75, cy = 75, r = 58, inner = 34;
let cum = -90;
const paths = slices.map(([cat, val], i) => {
const angle = total > 0 ? (val / total) * 360 : 0;
const s = cum; cum += angle;
const tr = d => (d * Math.PI) / 180;
const lg = angle > 180 ? 1 : 0;
const p = `M ${cx+r*Math.cos(tr(s))} ${cy+r*Math.sin(tr(s))} A ${r} ${r} 0 ${lg} 1 ${cx+r*Math.cos(tr(s+angle))} ${cy+r*Math.sin(tr(s+angle))} L ${cx+inner*Math.cos(tr(s+angle))} ${cy+inner*Math.sin(tr(s+angle))} A ${inner} ${inner} 0 ${lg} 0 ${cx+inner*Math.cos(tr(s))} ${cy+inner*Math.sin(tr(s))} Z`;
return { p, color: CAT_COLORS[i % CAT_COLORS.length], cat, val };
});
return (
<div style={{ display:“flex”, alignItems:“center”, gap:14 }}>
<svg width={size} height={size} style={{ flexShrink:0 }}>
{paths.map((p, i) => (
<path key={i} d={p.p} fill={p.color}
opacity={hovered === null || hovered === i ? 1 : 0.25}
style={{ cursor:“pointer”, transition:“opacity 0.2s” }}
onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
))}
<circle cx={cx} cy={cy} r={inner} fill="#0f172a" />
<text x={cx} y={cy-6} textAnchor="middle" fill="#94a3b8" fontSize="9">Total</text>
<text x={cx} y={cy+9} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
${hovered !== null ? paths[hovered]?.val.toLocaleString() : total.toLocaleString()}
</text>
{hovered !== null && <text x={cx} y={cy+20} textAnchor="middle" fill={paths[hovered]?.color} fontSize="7">{paths[hovered]?.cat}</text>}
</svg>
<div style={{ display:“flex”, flexDirection:“column”, gap:5, minWidth:0 }}>
{paths.slice(0, 6).map((p, i) => (
<div key={i} style={{ display:“flex”, alignItems:“center”, gap:6, fontSize:10,
opacity:hovered === null || hovered === i ? 1 : 0.3, cursor:“pointer”, transition:“opacity 0.2s” }}
onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
<div style={{ width:7, height:7, borderRadius:2, background:p.color, flexShrink:0 }} />
<span style={{ color:”#94a3b8”, overflow:“hidden”, textOverflow:“ellipsis”, whiteSpace:“nowrap” }}>{p.cat}</span>
<span style={{ color:“white”, marginLeft:“auto”, paddingLeft:6 }}>${p.val.toLocaleString()}</span>
</div>
))}
</div>
</div>
);
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ sheetId, apiKey, onDisconnect }) {
const [tab, setTab] = useState(“overview”);
const [d, setD] = useState(null);
const [error, setError] = useState(””);
const [loading, setLoading] = useState(true);
const [lastRefresh, setLastRefresh] = useState(null);

const load = async () => {
setLoading(true); setError(””);
try {
const data = await fetchSheetData(sheetId, apiKey);
setD(data);
setLastRefresh(new Date().toLocaleTimeString());
} catch (e) {
setError(“Failed to load data. Make sure your sheet is shared publicly (Viewer).”);
}
setLoading(false);
};

useEffect(() => { load(); }, []); // eslint-disable-line

if (loading) return (
<div style={{ background:”#0a0f1a”, minHeight:“100vh”, display:“flex”, alignItems:“center”,
justifyContent:“center”, fontFamily:”‘DM Mono’,monospace” }}>
<div style={{ textAlign:“center” }}>
<div style={{ fontSize:32, marginBottom:12, animation:“spin 1s linear infinite” }}>⟳</div>
<div style={{ color:”#475569”, fontSize:12, letterSpacing:2 }}>LOADING SHEET DATA…</div>
</div>
<style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
</div>
);

if (error) return (
<div style={{ background:”#0a0f1a”, minHeight:“100vh”, display:“flex”, alignItems:“center”,
justifyContent:“center”, fontFamily:”‘DM Mono’,monospace”, padding:24 }}>
<div style={{ background:”#0f172a”, border:“1px solid #f8717140”, borderRadius:16, padding:28, maxWidth:380, textAlign:“center” }}>
<div style={{ fontSize:32, marginBottom:10 }}>⚠</div>
<p style={{ color:”#f87171”, fontSize:13 }}>{error}</p>
<button onClick={load} style={{ marginTop:16, padding:“10px 24px”, background:”#4ade80”,
color:”#0a0f1a”, border:“none”, borderRadius:8, fontWeight:“bold”, cursor:“pointer”, fontFamily:“inherit” }}>Retry</button>
<button onClick={onDisconnect} style={{ marginTop:8, display:“block”, width:“100%”, padding:“10px”,
background:“transparent”, color:”#475569”, border:“1px solid #1e293b”, borderRadius:8,
cursor:“pointer”, fontFamily:“inherit”, fontSize:12 }}>← Change credentials</button>
</div>
</div>
);

const { income, expenses, catExpense, catIncome, transactions, currentMonth, currency } = d;
const netSavings = income - expenses;
const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : “0.0”;
const sortedExp = Object.entries(catExpense).sort((a, b) => b[1] - a[1]);
const sortedInc = Object.entries(catIncome).sort((a, b) => b[1] - a[1]);

return (
<div style={{ fontFamily:”‘DM Mono’,‘Courier New’,monospace”, background:”#0a0f1a”, minHeight:“100vh”, color:“white” }}>
<div style={{ position:“fixed”, top:-200, left:-200, width:500, height:500,
background:“radial-gradient(circle, #0d4f3c35 0%, transparent 70%)”, pointerEvents:“none”, zIndex:0 }} />

```
  {/* Header */}
  <div style={{ padding:"18px 20px 0", position:"relative", zIndex:1 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:16 }}>💰</span>
          <span style={{ fontSize:10, color:"#4ade80", letterSpacing:3, textTransform:"uppercase", fontWeight:"bold" }}>Budget Tracker Pro</span>
          <span style={{ fontSize:9, color:"#4ade8060", border:"1px solid #4ade8030",
            borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>LIVE</span>
        </div>
        <div style={{ fontSize:22, fontWeight:"bold", letterSpacing:-0.5, fontFamily:"'Georgia',serif" }}>
          {currentMonth || "All Time"}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:9, color:"#475569", marginBottom:2 }}>SAVINGS RATE</div>
        <div style={{ fontSize:24, fontWeight:"bold", color:"#4ade80", fontFamily:"'Georgia',serif" }}>{savingsRate}%</div>
        <div style={{ fontSize:9, color:"#334155", marginTop:2 }}>↻ {lastRefresh}</div>
      </div>
    </div>

    <div style={{ display:"flex", gap:2, marginTop:16, borderBottom:"1px solid #1e293b" }}>
      {["overview","transactions"].map(t => (
        <button key={t} onClick={() => setTab(t)} style={{ background:"none", border:"none",
          color:tab===t?"#4ade80":"#475569", fontSize:10, letterSpacing:2, textTransform:"uppercase",
          padding:"7px 12px", cursor:"pointer",
          borderBottom:tab===t?"2px solid #4ade80":"2px solid transparent",
          transition:"all 0.2s", fontFamily:"inherit" }}>{t}</button>
      ))}
      <button onClick={load} style={{ marginLeft:"auto", background:"none", border:"none",
        color:"#334155", fontSize:10, cursor:"pointer", padding:"7px 10px", fontFamily:"inherit" }}>↻ Refresh</button>
      <button onClick={onDisconnect} style={{ background:"none", border:"none",
        color:"#334155", fontSize:10, cursor:"pointer", padding:"7px 10px", fontFamily:"inherit" }}>⏏ Disconnect</button>
    </div>
  </div>

  <div style={{ padding:"14px 20px 28px", position:"relative", zIndex:1 }}>
    {tab === "overview" && (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[
            { label:"Income",    value:income,     color:"#4ade80" },
            { label:"Expenses",  value:expenses,   color:"#f87171" },
            { label:"Net Saved", value:netSavings, color:netSavings>=0?"#60a5fa":"#fb923c" },
          ].map((k, i) => (
            <div key={i} style={{ background:"#0f172a", border:`1px solid ${k.color}20`,
              borderRadius:10, padding:"12px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:k.color, opacity:0.5 }} />
              <div style={{ fontSize:9, color:"#475569", letterSpacing:2, marginBottom:5 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize:16, fontWeight:"bold", color:k.color, fontFamily:"'Georgia',serif" }}>
                <AnimatedNumber value={k.value} prefix={currency} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:14 }}>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:2, marginBottom:10 }}>EXPENSE BREAKDOWN</div>
            {sortedExp.length > 0
              ? <DonutChart slices={sortedExp} total={expenses} />
              : <p style={{ color:"#334155", fontSize:11 }}>No expense data</p>}
          </div>
          <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:14 }}>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:2, marginBottom:10 }}>TOP SPENDING</div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {sortedExp.slice(0, 5).map(([cat, val], i) => (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                    <span style={{ color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>{cat}</span>
                    <span style={{ color:CAT_COLORS[i] }}>{currency}{val.toLocaleString()}</span>
                  </div>
                  <ProgressBar pct={(val/expenses)*100} color={CAT_COLORS[i]} delay={i*80} />
                </div>
              ))}
              {sortedExp.length === 0 && <p style={{ color:"#334155", fontSize:11 }}>No data yet</p>}
            </div>
          </div>
        </div>

        <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:14 }}>
          <div style={{ fontSize:9, color:"#475569", letterSpacing:2, marginBottom:10 }}>INCOME SOURCES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {sortedInc.map(([cat, val], i) => (
              <div key={i}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                  <span style={{ color:"#94a3b8" }}>{cat}</span>
                  <span style={{ color:"#4ade80" }}>{currency}{val.toLocaleString()} · {income>0?((val/income)*100).toFixed(1):0}%</span>
                </div>
                <ProgressBar pct={income>0?(val/income)*100:0} color="#4ade80" delay={i*60} />
              </div>
            ))}
            {sortedInc.length === 0 && <p style={{ color:"#334155", fontSize:11 }}>No income data</p>}
          </div>
        </div>
      </div>
    )}

    {tab === "transactions" && (
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        <div style={{ fontSize:10, color:"#334155", marginBottom:4 }}>{transactions.length} transactions from Google Sheets</div>
        {transactions.length === 0 && (
          <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10,
            padding:24, textAlign:"center", color:"#475569", fontSize:12 }}>
            No transactions found for {currentMonth || "this period"}.
          </div>
        )}
        {[...transactions].reverse().map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
            background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"9px 12px" }}>
            <div style={{ width:30, height:30, borderRadius:7, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
              background:t.type==="Income"?"#0d4f3c":"#3f1515" }}>
              {t.type === "Income" ? "↑" : "↓"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.desc || t.cat}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{t.date} · {t.cat}</div>
            </div>
            <div style={{ fontSize:13, fontWeight:"bold", flexShrink:0,
              color:t.type==="Income"?"#4ade80":"#f87171" }}>
              {t.type==="Income"?"+":"-"}{currency}{Number(t.amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

);
}

// ─── ROOT ────────────────────────────────────────────────────
export default function App() {
const [creds, setCreds] = useState(null);
if (!creds) return <ConfigPanel onConnect={(id, key) => setCreds({ id, key })} />;
return <Dashboard sheetId={creds.id} apiKey={creds.key} onDisconnect={() => setCreds(null)} />;
}
