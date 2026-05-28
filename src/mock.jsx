mport { useState, useEffect, useCallback } from “react”;

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = “”; // Set your API base URL here, e.g. “https://api.cleanstreak.ng”

async function apiFetch(path, { token, method = “GET”, body } = {}) {
const headers = { “Content-Type”: “application/json” };
if (token) headers[“Authorization”] = `Bearer ${token}`;
const res = await fetch(`${BASE_URL}${path}`, {
method,
headers,
body: body ? JSON.stringify(body) : undefined,
});
if (!res.ok) {
const err = await res.json().catch(() => ({}));
throw new Error(err?.detail?.[0]?.msg || err?.detail || `HTTP ${res.status}`);
}
return res.json();
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const getFillColor = (level) => {
if (level >= 85) return “#ef4444”;
if (level >= 70) return “#f97316”;
return “#22c55e”;
};

const getFillBg = (level) => {
if (level >= 85) return “bg-red-100 text-red-700”;
if (level >= 70) return “bg-orange-100 text-orange-700”;
return “bg-green-100 text-green-700”;
};

const timeAgo = (iso) => {
const diff = (Date.now() - new Date(iso)) / 1000;
if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
return `${Math.floor(diff / 86400)}d ago`;
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
const [form, setForm] = useState({ email: “”, password: “” });
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const set = (k, v) => setForm(f => ({ …f, [k]: v }));

const handleSubmit = async () => {
setLoading(true);
setError(null);
try {
const data = await apiFetch(”/api/auth/login”, {
method: “POST”,
body: { email: form.email, password: form.password },
});
onLogin(data.access_token, data.role, data.user_id);
} catch (e) {
setError(e.message);
} finally {
setLoading(false);
}
};

return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
<div className="flex items-center gap-3 mb-8">
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xl">♻</div>
<div>
<p className="font-extrabold text-slate-800 text-lg">CleanStreak</p>
<p className="text-xs text-slate-400">Admin Portal</p>
</div>
</div>
<div className="space-y-4">
<div>
<label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
<input
type=“email”
className=“w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500”
placeholder=“admin@cleanstreak.ng”
value={form.email}
onChange={e => set(“email”, e.target.value)}
onKeyDown={e => e.key === “Enter” && handleSubmit()}
/>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
<input
type=“password”
className=“w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500”
placeholder=”••••••••”
value={form.password}
onChange={e => set(“password”, e.target.value)}
onKeyDown={e => e.key === “Enter” && handleSubmit()}
/>
</div>
{error && <p className="text-xs text-red-500 font-medium">{error}</p>}
<button
onClick={handleSubmit}
disabled={loading}
className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
>
{loading ? “Signing in…” : “Sign In”}
</button>
</div>
</div>
</div>
);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = “blue”, sub }) {
const colors = {
blue: “from-blue-500 to-blue-600”,
green: “from-green-500 to-green-600”,
red: “from-red-500 to-red-600”,
orange: “from-orange-500 to-orange-600”,
gray: “from-slate-500 to-slate-600”,
teal: “from-teal-500 to-teal-600”,
};
return (
<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-xl flex-shrink-0`}>
{icon}
</div>
<div>
<p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
<p className="text-2xl font-bold text-slate-800 leading-tight">{value ?? “—”}</p>
{sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
</div>
</div>
);
}

function BinMarker({ bin, onClick, isSelected }) {
const isRecyclable = bin.binTypeName === “recyclable”;
const isFull = bin.level >= 80;
const hasPickup = bin.pickupRequest;
const baseColor = isRecyclable ? “#3b82f6” : “#22c55e”;
const borderColor = isSelected ? “#f59e0b” : isFull ? “#ef4444” : baseColor;
return (
<div
onClick={() => onClick(bin)}
className=“absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110”
style={{ left: `${bin._mapX}%`, top: `${bin._mapY}%` }}
title={`BIN-${String(bin.id).padStart(3, "0")}`}
>
<div className="relative">
<div
className=“w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all”
style={{
backgroundColor: baseColor,
border: `3px solid ${borderColor}`,
boxShadow: isSelected ? `0 0 0 4px rgba(245,158,11,0.3)` : isFull ? `0 0 0 4px rgba(239,68,68,0.25)` : `0 0 6px rgba(0,0,0,0.15)`,
}}
>
{isRecyclable ? “♻” : “🌿”}
</div>
{hasPickup && (
<span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
)}
{isFull && !hasPickup && (
<span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
)}
</div>
<div className=“w-1 h-2 mx-auto” style={{ backgroundColor: borderColor, marginTop: “-1px” }} />
</div>
);
}

function BinDetailPopup({ bin, onClose, onAssign, onMarkPickedUp }) {
if (!bin) return null;
const isRecyclable = bin.binTypeName === “recyclable”;
return (
<div className="absolute top-4 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
<div className={`px-4 py-3 flex items-center justify-between ${isRecyclable ? "bg-blue-500" : "bg-green-500"}`}>
<div className="flex items-center gap-2">
<span className="text-white text-lg">{isRecyclable ? “♻” : “🌿”}</span>
<div>
<p className="text-white font-bold text-sm">BIN-{String(bin.id).padStart(3, “0”)}</p>
<p className="text-white/80 text-xs capitalize">{bin.binTypeName}</p>
</div>
</div>
<button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
</div>
<div className="p-4 space-y-3">
<div>
<p className="text-xs text-slate-500 mb-1">Fill Level</p>
<div className="flex items-center gap-2">
<div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
<div className=“h-full rounded-full transition-all” style={{ width: `${bin.level}%`, backgroundColor: getFillColor(bin.level) }} />
</div>
<span className=“text-sm font-bold” style={{ color: getFillColor(bin.level) }}>{bin.level}%</span>
</div>
</div>
<div className="grid grid-cols-2 gap-2 text-xs">
<div className="bg-slate-50 rounded-lg p-2 col-span-2">
<p className="text-slate-400">Location</p>
<p className="text-slate-700 font-medium mt-0.5 leading-tight">{bin.address || “—”}</p>
</div>
<div className="bg-slate-50 rounded-lg p-2">
<p className="text-slate-400">Pickup Request</p>
<span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${bin.pickupRequest ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
{bin.pickupRequest ? “Pending” : “None”}
</span>
</div>
<div className="bg-slate-50 rounded-lg p-2">
<p className="text-slate-400">Bin ID</p>
<p className="text-slate-700 font-medium mt-0.5">#{bin.id}</p>
</div>
</div>
<div className="flex gap-2 pt-1">
<button onClick={() => onAssign(bin)} className=“flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors”>Assign</button>
{bin.pickupRequest && (
<button onClick={() => onMarkPickedUp(bin)} className=“flex-1 py-1.5 text-xs font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors”>Mark Picked Up</button>
)}
</div>
</div>
</div>
);
}

function CreateBinModal({ binTypes, onClose, onCreate }) {
const [form, setForm] = useState({ type_id: binTypes[0]?.id || “”, });
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const set = (k, v) => setForm(f => ({ …f, [k]: v }));

const handleCreate = async () => {
if (!form.type_id) { setError(“Please select a bin type.”); return; }
setLoading(true);
setError(null);
try {
await onCreate({ type_id: parseInt(form.type_id) });
onClose();
} catch (e) {
setError(e.message);
setLoading(false);
}
};

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
<h2 className="text-lg font-bold text-slate-800">Register New Bin</h2>
<button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
</div>
<div className="p-6 space-y-4">
<div>
<label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Bin Type</label>
<select
className=“w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500”
value={form.type_id}
onChange={e => set(“type_id”, e.target.value)}
>
{binTypes.map(bt => (
<option key={bt.id} value={bt.id}>{bt.name}</option>
))}
</select>
</div>
{error && <p className="text-xs text-red-500">{error}</p>}
</div>
<div className="px-6 py-4 border-t border-slate-100 flex gap-3">
<button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
<button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
{loading ? “Creating…” : “Create Bin”}
</button>
</div>
</div>
</div>
);
}

function AssignBinModal({ bins, preselectedBin, onClose, onSave }) {
const [form, setForm] = useState({ binId: preselectedBin?.id || “” });
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const set = (k, v) => setForm(f => ({ …f, [k]: v }));

const handleSave = async () => {
if (!form.binId) { setError(“Please select a bin.”); return; }
setLoading(true);
setError(null);
try {
await onSave({ bin_id: parseInt(form.binId) });
onClose();
} catch (e) {
setError(e.message);
setLoading(false);
}
};

return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
<h2 className="text-lg font-bold text-slate-800">Assign Bin to Client</h2>
<button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
</div>
<div className="p-6 space-y-4">
<div>
<label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Select Bin</label>
<select
className=“w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500”
value={form.binId}
onChange={e => set(“binId”, e.target.value)}
>
<option value="">Choose bin…</option>
{bins.map(b => (
<option key={b.id} value={b.id}>BIN-{String(b.id).padStart(3, “0”)} — {b.binTypeName}</option>
))}
</select>
</div>
<p className="text-xs text-slate-400">This will call PATCH /api/clients/me/assign-bin on behalf of the logged-in client. For admin assignment, use the Clients section.</p>
{error && <p className="text-xs text-red-500">{error}</p>}
</div>
<div className="px-6 py-4 border-t border-slate-100 flex gap-3">
<button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Cancel</button>
<button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
{loading ? “Saving…” : “Save Assignment”}
</button>
</div>
</div>
</div>
);
}

function Toast({ message, type = “success”, onClose }) {
useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
return (
<div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold z-[100] ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
<span>{type === “success” ? “✓” : “✕”}</span>
{message}
</div>
);
}

// ─── Map Component ──────────────────────────────────────────────────────────
function MapView({ bins, onBinClick, selectedBin, onAssign, onMarkPickedUp }) {
if (!bins.length) {
return (
<div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
<p className="text-slate-400 text-sm">No bins to display</p>
</div>
);
}

const lats = bins.map(b => b.lat).filter(Boolean);
const lngs = bins.map(b => b.lng).filter(Boolean);
const minLat = Math.min(…lats), maxLat = Math.max(…lats);
const minLng = Math.min(…lngs), maxLng = Math.max(…lngs);
const padLat = (maxLat - minLat) * 0.18 || 0.01;
const padLng = (maxLng - minLng) * 0.18 || 0.01;

const withPos = bins
.filter(b => b.lat && b.lng)
.map(b => ({
…b,
_mapX: ((b.lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * 100,
_mapY: (1 - (b.lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * 100,
}));

return (
<div className=“relative w-full h-full rounded-2xl overflow-hidden bg-slate-100” style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}>
<div className=“absolute inset-0” style={{ background: “linear-gradient(135deg, #dbeafe 0%, #dcfce7 50%, #f0fdf4 100%)”, opacity: 0.7 }} />
<svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.5"/>
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#grid)" />
</svg>
<svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
<path d="M 20% 0% L 20% 100%" stroke="#e2e8f0" strokeWidth="6" fill="none"/>
<path d="M 60% 0% L 60% 100%" stroke="#e2e8f0" strokeWidth="6" fill="none"/>
<path d="M 0% 35% L 100% 35%" stroke="#e2e8f0" strokeWidth="6" fill="none"/>
<path d="M 0% 70% L 100% 70%" stroke="#e2e8f0" strokeWidth="6" fill="none"/>
</svg>
{withPos.map(bin => (
<BinMarker key={bin.id} bin={bin} onClick={onBinClick} isSelected={selectedBin?.id === bin.id} />
))}
<div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs">
<p className="font-bold text-slate-700">Bin Map</p>
<p className="text-slate-400">{bins.length} bins loaded</p>
</div>
<div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow space-y-1.5 text-xs">
<div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-blue-500" /><span className="text-slate-600">Recyclable</span></div>
<div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-green-500" /><span className="text-slate-600">Perishable</span></div>
<div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-400" /><span className="text-slate-600">Full (≥80%)</span></div>
<div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-orange-400 animate-pulse" /><span className="text-slate-600">Pickup req.</span></div>
</div>
{selectedBin && <BinDetailPopup bin={selectedBin} onClose={() => onBinClick(null)} onAssign={onAssign} onMarkPickedUp={onMarkPickedUp} />}
</div>
);
}

// ─── Leaderboard View ─────────────────────────────────────────────────────────
function LeaderboardView({ token }) {
const [entries, setEntries] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
apiFetch(”/api/clients/leaderboard?limit=20”)
.then(setEntries)
.catch(() => {})
.finally(() => setLoading(false));
}, []);

if (loading) return <LoadingState label="Loading leaderboard…" />;

return (
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
<div className="px-5 py-4 border-b border-slate-100">
<p className="font-bold text-slate-800">Points Leaderboard</p>
<p className="text-xs text-slate-400 mt-0.5">Top clients by total points earned</p>
</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-slate-50">
{[“Rank”, “Name”, “Client ID”, “Total Points”].map(h => (
<th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
))}
</tr>
</thead>
<tbody>
{entries.map((e, i) => (
<tr key={e.client_id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
<td className="px-5 py-3">
<span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${e.rank === 1 ? "bg-yellow-100 text-yellow-700" : e.rank === 2 ? "bg-slate-100 text-slate-600" : e.rank === 3 ? "bg-orange-100 text-orange-600" : "text-slate-500"}`}>
{e.rank <= 3 ? [“🥇”,“🥈”,“🥉”][e.rank - 1] : e.rank}
</span>
</td>
<td className="px-5 py-3 font-semibold text-slate-700">{e.name}</td>
<td className="px-5 py-3 text-slate-400">#{e.client_id}</td>
<td className="px-5 py-3"><span className="font-bold text-blue-600">{e.total_points.toLocaleString()} pts</span></td>
</tr>
))}
{entries.length === 0 && (
<tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No leaderboard data yet</td></tr>
)}
</tbody>
</table>
</div>
</div>
);
}

// ─── Clients View ─────────────────────────────────────────────────────────────
function ClientsView({ token }) {
const [clients, setClients] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
apiFetch(”/api/clients/”, { token })
.then(setClients)
.catch(e => setError(e.message))
.finally(() => setLoading(false));
}, [token]);

if (loading) return <LoadingState label="Loading clients…" />;
if (error) return <ErrorState message={error} />;

return (
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
<div>
<p className="font-bold text-slate-800">All Clients</p>
<p className="text-xs text-slate-400 mt-0.5">{clients.length} registered clients</p>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-slate-50">
{[“ID”, “Address”, “Phone”, “Bin”, “Credit (₦)”, “Active Pts”, “Total Pts”].map(h => (
<th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
))}
</tr>
</thead>
<tbody>
{clients.map((c, i) => (
<tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
<td className="px-4 py-3 font-bold text-slate-500">#{c.id}</td>
<td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{c.address}</td>
<td className="px-4 py-3 text-slate-600">{c.phone}</td>
<td className="px-4 py-3">{c.bin_id ? <span className="font-mono text-blue-600">BIN-{String(c.bin_id).padStart(3,“0”)}</span> : <span className="text-slate-400 text-xs">Unassigned</span>}</td>
<td className="px-4 py-3 text-green-600 font-semibold">₦{c.credit.toFixed(2)}</td>
<td className="px-4 py-3 font-bold text-blue-600">{c.active_points}</td>
<td className="px-4 py-3 font-bold text-slate-700">{c.total_points}</td>
</tr>
))}
{clients.length === 0 && (
<tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No clients registered yet</td></tr>
)}
</tbody>
</table>
</div>
</div>
);
}

// ─── Pickup Requests View ─────────────────────────────────────────────────────
function PickupRequestsView({ token, requests, onApprove, loading }) {
const [filter, setFilter] = useState(“all”);
const filtered = filter === “all” ? requests : requests.filter(r => r.status === filter);

return (
<div className="space-y-4">
<div className="flex gap-2">
{[“all”, “pending”, “approved”].map(f => (
<button
key={f}
onClick={() => setFilter(f)}
className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}
>
{f} {f !== “all” && <span className="opacity-60">({requests.filter(r => r.status === f).length})</span>}
</button>
))}
</div>
{loading ? <LoadingState label="Loading requests…" /> : (
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-slate-100">
{[“ID”, “Bin”, “Fill Level”, “Address”, “Client”, “Phone”, “Status”, “Created”, “Action”].map(h => (
<th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
))}
</tr>
</thead>
<tbody>
{filtered.map((req, i) => (
<tr key={req.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
<td className="px-4 py-3 text-slate-400 font-mono">#{req.id}</td>
<td className="px-4 py-3 font-bold text-blue-600">BIN-{String(req.bin_id).padStart(3,“0”)}</td>
<td className="px-4 py-3">
<div className="flex items-center gap-2">
<div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
<div className=“h-full rounded-full” style={{ width: `${req.level}%`, backgroundColor: getFillColor(req.level) }} />
</div>
<span className=“font-bold text-xs” style={{ color: getFillColor(req.level) }}>{req.level}%</span>
</div>
</td>
<td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{req.address}</td>
<td className="px-4 py-3 text-slate-700 font-medium">{req.client_name}</td>
<td className="px-4 py-3 text-slate-500">{req.client_phone}</td>
<td className="px-4 py-3">
<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${req.status === "pending" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
{req.status === “pending” ? “🕐 Pending” : “✓ Approved”}
</span>
</td>
<td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(req.created_at)}</td>
<td className="px-4 py-3">
{req.status === “pending” && (
<button
onClick={() => onApprove(req.id)}
className=“px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition”
>
✓ Approve
</button>
)}
</td>
</tr>
))}
{filtered.length === 0 && (
<tr><td colSpan={9} className="text-center py-8 text-slate-400 text-sm">No {filter !== “all” ? filter : “”} pickup requests</td></tr>
)}
</tbody>
</table>
</div>
</div>
)}
</div>
);
}

// ─── Loading / Error helpers ───────────────────────────────────────────────────
function LoadingState({ label = “Loading…” }) {
return (
<div className="flex items-center justify-center py-16">
<div className="flex flex-col items-center gap-3">
<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
<p className="text-slate-400 text-sm">{label}</p>
</div>
</div>
);
}

function ErrorState({ message, onRetry }) {
return (
<div className="flex flex-col items-center justify-center py-16 gap-3">
<p className="text-red-500 font-semibold text-sm">⚠ {message}</p>
{onRetry && <button onClick={onRetry} className="text-xs text-blue-500 hover:underline">Retry</button>}
</div>
);
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CleanStreakDashboard() {
// Auth
const [token, setToken] = useState(null);
const [userRole, setUserRole] = useState(null);
const [userId, setUserId] = useState(null);

// UI
const [activeNav, setActiveNav] = useState(“Dashboard”);
const [sidebarOpen, setSidebarOpen] = useState(true);
const [toast, setToast] = useState(null);
const [searchQuery, setSearchQuery] = useState(””);
const [filter, setFilter] = useState(“all”);
const [selectedBin, setSelectedBin] = useState(null);
const [showCreate, setShowCreate] = useState(false);
const [showAssign, setShowAssign] = useState(false);
const [assignBin, setAssignBin] = useState(null);

// Data
const [bins, setBins] = useState([]);
const [binTypes, setBinTypes] = useState([]);
const [pickupRequests, setPickupRequests] = useState([]);
const [loadingBins, setLoadingBins] = useState(false);
const [loadingPickups, setLoadingPickups] = useState(false);

const showToast = (msg, type = “success”) => setToast({ msg, type });

const handleLogin = (accessToken, role, uid) => {
setToken(accessToken);
setUserRole(role);
setUserId(uid);
};

// ── Fetch bins + bin types ──────────────────────────────────────────────────
const fetchBins = useCallback(async () => {
setLoadingBins(true);
try {
const [rawBins, types] = await Promise.all([
apiFetch(”/api/bins/”),
apiFetch(”/api/bin-types/”),
]);
setBinTypes(types);

```
// Enrich each bin with its type name
const typeMap = Object.fromEntries(types.map(t => [t.id, t.name]));

// Fetch pickup requests to know which bins have pending requests
const pickups = await apiFetch("/api/pickup-requests/", { token });
const pendingBinIds = new Set(
pickups.filter(r => r.status === "pending").map(r => r.bin_id)
);

// Build a map of bin_id -> client info from pickup requests for address
const binAddressMap = {};
pickups.forEach(r => { if (!binAddressMap[r.bin_id]) binAddressMap[r.bin_id] = r.address; });

const enriched = rawBins.map(b => ({
...b,
binTypeName: typeMap[b.type_id] || "unknown",
pickupRequest: pendingBinIds.has(b.id),
address: binAddressMap[b.id] || null,
lat: null,
lng: null,
}));

// Attempt to fetch per-bin client address via pickup history
// (address comes from PickupDashboardItem)
setBins(enriched);
} catch (e) {
showToast("Failed to load bins: " + e.message, "error");
} finally {
setLoadingBins(false);
}
```

}, [token]);

// ── Fetch pickup requests ───────────────────────────────────────────────────
const fetchPickupRequests = useCallback(async () => {
if (!token) return;
setLoadingPickups(true);
try {
const data = await apiFetch(”/api/pickup-requests/”, { token });
setPickupRequests(data);
} catch (e) {
showToast(“Failed to load pickup requests: “ + e.message, “error”);
} finally {
setLoadingPickups(false);
}
}, [token]);

useEffect(() => {
if (!token) return;
fetchBins();
fetchPickupRequests();
}, [token, fetchBins, fetchPickupRequests]);

// ── Handlers ───────────────────────────────────────────────────────────────
const handleCreate = async (formData) => {
const newBin = await apiFetch(”/api/bins/”, {
token,
method: “POST”,
body: formData,
});
showToast(`BIN-${String(newBin.id).padStart(3,"0")} registered`);
fetchBins();
};

const handleAssign = async (formData) => {
await apiFetch(”/api/clients/me/assign-bin”, {
token,
method: “PATCH”,
body: formData,
});
showToast(“Bin assigned successfully”);
fetchBins();
};

const handleApprovePickup = async (requestId) => {
try {
await apiFetch(`/api/pickup-requests/${requestId}/approve`, {
token,
method: “POST”,
});
showToast(“Pickup approved — bin reset to 0%”);
await fetchPickupRequests();
await fetchBins();
} catch (e) {
showToast(“Approve failed: “ + e.message, “error”);
}
};

const handleMarkPickedUp = (bin) => {
// Find the pending pickup request for this bin and approve it
const req = pickupRequests.find(r => r.bin_id === bin.id && r.status === “pending”);
if (req) {
handleApprovePickup(req.id);
} else {
showToast(“No pending pickup request for this bin”, “error”);
}
};

const openAssign = (bin) => { setAssignBin(bin); setShowAssign(true); };
const handleBinClick = (bin) => setSelectedBin(bin?.id === selectedBin?.id ? null : bin);

// ── Derived data ────────────────────────────────────────────────────────────
const filteredBins = bins.filter(b => {
const q = searchQuery.toLowerCase();
const binLabel = `BIN-${String(b.id).padStart(3,"0")}`;
if (q && !binLabel.toLowerCase().includes(q) && !(b.address || “”).toLowerCase().includes(q)) return false;
if (filter === “recyclable”) return b.binTypeName === “recyclable”;
if (filter === “perishable”) return b.binTypeName === “perishable”;
if (filter === “full”) return b.level >= 80;
if (filter === “full-recyclable”) return b.binTypeName === “recyclable” && b.level >= 80;
if (filter === “full-perishable”) return b.binTypeName === “perishable” && b.level >= 80;
if (filter === “pickup”) return b.pickupRequest;
if (filter === “unassigned”) return !b.pickupRequest && b.level < 80;
return true;
});

const stats = {
total: bins.length,
recyclable: bins.filter(b => b.binTypeName === “recyclable”).length,
perishable: bins.filter(b => b.binTypeName === “perishable”).length,
full: bins.filter(b => b.level >= 80).length,
pickup: pickupRequests.filter(r => r.status === “pending”).length,
unassigned: bins.filter(b => !b.pickupRequest && b.level < 80).length,
};

const attentionBins = bins
.filter(b => b.level >= 70 || b.pickupRequest)
.sort((a, b) => b.level - a.level);

const navItems = [
{ name: “Dashboard”, icon: “🏠” },
{ name: “Bins”, icon: “🗑” },
{ name: “Pickup Requests”, icon: “🚛” },
{ name: “Clients”, icon: “👥” },
{ name: “Leaderboard”, icon: “🏆” },
];

if (!token) return <LoginScreen onLogin={handleLogin} />;

return (
<div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
{/* Sidebar */}
<aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all duration-300 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col shadow-sm z-20`}>
<div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-lg flex-shrink-0">♻</div>
{sidebarOpen && <div><p className="font-extrabold text-slate-800 text-sm tracking-tight">CleanStreak</p><p className="text-xs text-slate-400">Admin Portal</p></div>}
</div>
<nav className="flex-1 p-3 space-y-1">
{navItems.map(item => (
<button
key={item.name}
onClick={() => setActiveNav(item.name)}
className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === item.name ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
>
<span className="text-base flex-shrink-0">{item.icon}</span>
{sidebarOpen && <span className="truncate">{item.name}</span>}
{sidebarOpen && item.name === “Pickup Requests” && stats.pickup > 0 && (
<span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{stats.pickup}</span>
)}
</button>
))}
</nav>
<div className="p-3 border-t border-slate-100">
<div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 ${!sidebarOpen && "justify-center"}`}>
<div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userRole?.[0]?.toUpperCase() || “?”}</div>
{sidebarOpen && <div><p className="text-xs font-semibold text-slate-700 capitalize">{userRole || “User”}</p><p className="text-xs text-slate-400">ID: {userId}</p></div>}
</div>
<button
onClick={() => { setToken(null); setUserRole(null); }}
className={`mt-2 w-full text-xs text-slate-400 hover:text-red-500 transition py-1 ${!sidebarOpen ? "text-center" : "text-left px-3"}`}
>
{sidebarOpen ? “Sign out” : “↩”}
</button>
</div>
</aside>

```
{/* Main */}
<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
{/* Topbar */}
<header className="h-16 bg-white border-b border-slate-100 flex items-center px-5 gap-4 flex-shrink-0 z-10 shadow-sm">
<button onClick={() => setSidebarOpen(s => !s)} className="text-slate-400 hover:text-slate-600 text-xl p-1 rounded-lg hover:bg-slate-50">☰</button>
<div className="flex-1 max-w-sm relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
<input
value={searchQuery}
onChange={e => setSearchQuery(e.target.value)}
placeholder="Search bins, locations…"
className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
/>
</div>
<div className="ml-auto flex items-center gap-3">
<button
onClick={() => { fetchBins(); fetchPickupRequests(); showToast("Data refreshed"); }}
className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 text-sm font-semibold"
title="Refresh data"
>
↻
</button>
<button className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-500 text-lg">
🔔
{stats.pickup > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
</button>
</div>
</header>

{/* Content */}
<main className="flex-1 overflow-auto p-5 space-y-5">
<div className="flex items-center justify-between">
<div>
<h1 className="text-xl font-extrabold text-slate-800">{activeNav}</h1>
<p className="text-sm text-slate-400 mt-0.5">CleanStreak Waste Management</p>
</div>
{(activeNav === "Dashboard" || activeNav === "Bins") && (
<div className="flex gap-2">
<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
+ Register Bin
</button>
<button onClick={() => { setAssignBin(null); setShowAssign(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
👤 Assign Bin
</button>
</div>
)}
</div>

{/* ── Dashboard ── */}
{(activeNav === "Dashboard" || activeNav === "Bins") && (
<>
{/* Stats */}
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
<StatCard icon="🗑" label="Total Bins" value={loadingBins ? "…" : stats.total} color="blue" />
<StatCard icon="♻" label="Recyclable" value={loadingBins ? "…" : stats.recyclable} color="blue" />
<StatCard icon="🌿" label="Perishable" value={loadingBins ? "…" : stats.perishable} color="green" />
<StatCard icon="🔴" label="Full Bins" value={loadingBins ? "…" : stats.full} color="red" sub="≥80% capacity" />
<StatCard icon="🚛" label="Pickup Req." value={loadingPickups ? "…" : stats.pickup} color="orange" sub="pending" />
<StatCard icon="⚠" label="No Requests" value={loadingBins ? "…" : stats.unassigned} color="gray" />
</div>

{/* Map + Side Panel */}
<div className="flex gap-4 h-[480px]">
<div className="flex-1 flex flex-col gap-3 min-w-0">
<div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
{[
["all", "All Bins"],
["recyclable", "♻ Recyclable"],
["perishable", "🌿 Perishable"],
["full", "🔴 Full"],
["pickup", "🚛 Pickup Req."],
].map(([val, label]) => (
<button
key={val}
onClick={() => setFilter(val)}
className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === val ? "bg-slate-800 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}
>
{label}
</button>
))}
</div>
<div className="flex-1 relative">
{loadingBins
? <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center"><LoadingState label="Loading map…" /></div>
: <MapView bins={filteredBins} onBinClick={handleBinClick} selectedBin={selectedBin} onAssign={openAssign} onMarkPickedUp={handleMarkPickedUp} />
}
</div>
</div>

{/* Right panel */}
<div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1">
<div className="flex items-center justify-between mb-3">
<p className="font-bold text-slate-700 text-sm">Recent Pickup Requests</p>
<span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{stats.pickup} pending</span>
</div>
{loadingPickups ? (
<LoadingState label="Loading…" />
) : (
<div className="space-y-2">
{pickupRequests.slice(0, 5).map(req => (
<div key={req.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-blue-100 text-blue-600">🚛</div>
<div className="min-w-0">
<p className="text-xs font-semibold text-slate-700 truncate">BIN-{String(req.bin_id).padStart(3,"0")}</p>
<p className="text-xs text-slate-400 truncate">{req.address}</p>
<div className="flex items-center gap-1.5 mt-1">
<span className={`text-xs font-bold px-1.5 py-0.5 rounded ${req.status === "pending" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>{req.status}</span>
<span className="text-xs text-slate-400">{req.level}%</span>
<span className="text-xs text-slate-400 ml-auto">{timeAgo(req.created_at)}</span>
</div>
</div>
</div>
))}
{pickupRequests.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No pickup requests</p>}
</div>
)}
</div>

<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
<p className="font-bold text-slate-700 text-sm mb-3">Quick Actions</p>
<div className="grid grid-cols-2 gap-2">
{[
{ label: "Register Bin", icon: "➕", action: () => setShowCreate(true) },
{ label: "Pickup Queue", icon: "🚛", action: () => setActiveNav("Pickup Requests") },
{ label: "Clients", icon: "👥", action: () => setActiveNav("Clients") },
{ label: "Leaderboard", icon: "🏆", action: () => setActiveNav("Leaderboard") },
].map(a => (
<button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
<span className="text-lg">{a.icon}</span>
<span className="text-xs font-semibold text-slate-600">{a.label}</span>
</button>
))}
</div>
</div>
</div>
</div>

{/* Attention Table */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
<div>
<p className="font-bold text-slate-800">Bins Needing Attention</p>
<p className="text-xs text-slate-400 mt-0.5">Bins with ≥70% fill level or active pickup requests</p>
</div>
<span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">{attentionBins.length} bins</span>
</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-slate-50">
{["Bin ID", "Type", "Fill Level", "Address", "Status", "Action"].map(h => (
<th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
))}
</tr>
</thead>
<tbody>
{attentionBins.map((bin, i) => (
<tr key={bin.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
<td className="px-5 py-3">
<button onClick={() => handleBinClick(bin)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
BIN-{String(bin.id).padStart(3,"0")}
</button>
</td>
<td className="px-5 py-3">
<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bin.binTypeName === "recyclable" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
{bin.binTypeName === "recyclable" ? "♻ Recyclable" : "🌿 Perishable"}
</span>
</td>
<td className="px-5 py-3">
<div className="flex items-center gap-2">
<div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
<div className="h-full rounded-full" style={{ width: `${bin.level}%`, backgroundColor: getFillColor(bin.level) }} />
</div>
<span className="font-bold text-xs" style={{ color: getFillColor(bin.level) }}>{bin.level}%</span>
</div>
</td>
<td className="px-5 py-3 text-slate-600 max-w-[180px] truncate">{bin.address || "—"}</td>
<td className="px-5 py-3">
{bin.pickupRequest ? (
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">🚛 Pickup Req.</span>
) : (
<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getFillBg(bin.level)}`}>
{bin.level >= 85 ? "🔴 Critical" : "⚠ High"}
</span>
)}
</td>
<td className="px-5 py-3">
<div className="flex gap-1.5">
<button onClick={() => handleBinClick(bin)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">View</button>
{bin.pickupRequest && (
<button onClick={() => handleMarkPickedUp(bin)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition">✓ Approve</button>
)}
</div>
</td>
</tr>
))}
{attentionBins.length === 0 && !loadingBins && (
<tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">All bins are within normal levels ✓</td></tr>
)}
{loadingBins && (
<tr><td colSpan={6} className="text-center py-8"><LoadingState label="Loading bins…" /></td></tr>
)}
</tbody>
</table>
</div>
</div>
</>
)}

{activeNav === "Pickup Requests" && (
<PickupRequestsView token={token} requests={pickupRequests} onApprove={handleApprovePickup} loading={loadingPickups} />
)}

{activeNav === "Clients" && <ClientsView token={token} />}

{activeNav === "Leaderboard" && <LeaderboardView token={token} />}
</main>
</div>

{/* Modals */}
{showCreate && (
<CreateBinModal
binTypes={binTypes}
onClose={() => setShowCreate(false)}
onCreate={handleCreate}
/>
)}
{showAssign && (
<AssignBinModal
bins={bins}
preselectedBin={assignBin}
onClose={() => { setShowAssign(false); setAssignBin(null); }}
onSave={handleAssign}
/>
)}
{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
</div>
```

);
}
