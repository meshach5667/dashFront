import { useState, useEffect, useRef, useCallback } from "react";
import {
  login,
  getBins,
  getClients,
  getPickupRequests,
  approvePickup,
  createBin,
  assignBin,
} from "./services/api";

// ─── Utilities ────────────────────────────────────────────────────────────────
const getFillColor = (level) => {
  if (level >= 85) return "#ef4444";
  if (level >= 70) return "#f97316";
  return "#22c55e";
};

const getFillBg = (level) => {
  if (level >= 85) return "bg-red-100 text-red-700";
  if (level >= 70) return "bg-orange-100 text-orange-700";
  return "bg-green-100 text-green-700";
};

const formatBinName = (binId) => {
  const raw = String(binId ?? "").trim();
  if (!raw) return "BIN-UNKNOWN";
  return raw.startsWith("BIN-") ? raw : `BIN-${raw}`;
};

const timeAgo = (iso) => {
  if (!iso) return "-";
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "-";
  const diff = (Date.now() - timestamp) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const parseCoord = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const readStoredValue = (key) => {
  const value = localStorage.getItem(key);
  if (!value || value === "undefined" || value === "null") return "";
  return value;
};

const loadGoogleMaps = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key."));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__googleMapsPromise) return window.__googleMapsPromise;

  window.__googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return window.__googleMapsPromise;
};

const iconBase = "h-5 w-5";

const IconHome = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5L12 3l9 7.5V21a.75.75 0 0 1-.75.75H15v-6H9v6H3.75A.75.75 0 0 1 3 21v-10.5z" />
  </svg>
);

const IconMap = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l6-2 6 2v14l-6-2-6 2-6-2V3l6 2z" />
    <path d="M9 5v14" />
    <path d="M15 3v14" />
  </svg>
);

const IconTrash = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M7 7l1 13h8l1-13" />
  </svg>
);

const IconTruck = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 7.5h11v8h-11z" />
    <path d="M13.5 10.5h4l2 3v2h-6" />
    <circle cx="6.5" cy="17.5" r="1.5" />
    <circle cx="17.5" cy="17.5" r="1.5" />
  </svg>
);

const IconUsers = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    <path d="M4 19a6 6 0 0 1 16 0" />
    <path d="M19 8a2.5 2.5 0 1 1-5 0" />
  </svg>
);

const IconChart = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19h16" />
    <path d="M7 16v-5" />
    <path d="M12 16V7" />
    <path d="M17 16v-3" />
  </svg>
);

const IconBell = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 16v-5a6 6 0 1 0-12 0v5" />
    <path d="M5 16h14" />
    <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
  </svg>
);

const IconSettings = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.2.2a2 2 0 0 1-2.8 2.8l-.2-.2a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.3a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.2.2a2 2 0 1 1-2.8-2.8l.2-.2a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.3a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.2-.2a2 2 0 1 1 2.8-2.8l.2.2a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.3a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.2-.2a2 2 0 0 1 2.8 2.8l-.2.2a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.3a1 1 0 0 0-.9.6z" />
  </svg>
);

const IconSearch = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const IconPlus = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconUser = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

const IconRefresh = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v6h-6" />
  </svg>
);

const IconRecycle = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7.5 7.5l2.5-4 2.5 4" />
    <path d="M10 3.5h3.5a4.5 4.5 0 0 1 3.9 2.3" />
    <path d="M16.5 16.5l-2.5 4-2.5-4" />
    <path d="M14 20.5H10a4.5 4.5 0 0 1-3.9-2.3" />
    <path d="M4 10.5l2.5-4 2.5 4" />
    <path d="M6.5 6.5h3.5" />
  </svg>
);

const IconLeaf = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20c8 0 14-6 14-14-8 0-14 6-14 14z" />
    <path d="M10 14c2-2 4-4 8-6" />
  </svg>
);

const IconAlert = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l9 16H3l9-16z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconCheck = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const IconX = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin, loading, error }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    onLogin(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white">
            <IconRecycle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800 text-lg">CleanStreak</p>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@cleanstreak.ng"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "blue", sub }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
    orange: "from-orange-500 to-orange-600",
    gray: "from-slate-500 to-slate-600",
    teal: "from-teal-500 to-teal-600",
  };
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider leading-snug break-words">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight break-words">
          {value ?? "-"}
        </p>
        {sub && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug break-words">{sub}</p>}
      </div>
    </div>
  );
}

function BinDetailPopup({ bin, onClose, onAssign, onMarkPickedUp, canAssign, canApprove }) {
  if (!bin) return null;
  const isRecyclable = bin.type === "recyclable";
  return (
    <div className="absolute top-4 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
      <div className={`px-4 py-3 flex items-center justify-between ${isRecyclable ? "bg-blue-500" : "bg-green-500"}`}>
        <div className="flex items-center gap-2">
          <span className="text-white">
            {isRecyclable ? <IconRecycle className="h-5 w-5" /> : <IconLeaf className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-white font-bold text-sm">{bin.name}</p>
            <p className="text-white/80 text-xs capitalize">{bin.type}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Fill Level</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${bin.level}%`, backgroundColor: getFillColor(bin.level) }} />
            </div>
            <span className="text-sm font-bold" style={{ color: getFillColor(bin.level) }}>{bin.level}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-lg p-2 col-span-2">
            <p className="text-slate-400">Location</p>
            <p className="text-slate-700 font-medium mt-0.5 leading-tight">{bin.address}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-slate-400">Client</p>
            <p className="text-slate-700 font-medium mt-0.5">{bin.client?.label || "Unassigned"}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-slate-400">Pickup Request</p>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${bin.pickupRequest ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
              {bin.pickupRequest ? "Pending" : "None"}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-slate-400">Last Emptied</p>
            <p className="text-slate-700 font-medium mt-0.5">{bin.lastEmptied || "-"}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {canAssign && (
            <button onClick={() => onAssign(bin)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Assign</button>
          )}
          {canApprove && bin.pickupRequest && (
            <button onClick={() => onMarkPickedUp(bin)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">Approve Pickup</button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateBinModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ binId: "", binType: "recyclable" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.binId.trim()) {
      setError("Bin ID is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate({ binId: form.binId.trim(), binType: form.binType });
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Bin ID</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="BIN-001"
              value={form.binId}
              onChange={(e) => set("binId", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Bin Type</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.binType}
              onChange={(e) => set("binType", e.target.value)}
            >
              <option value="recyclable">Recyclable (Blue)</option>
              <option value="perishable">Perishable (Green)</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Creating..." : "Create Bin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignBinModal({ bins, preselectedBinId, onClose, onSave }) {
  const [form, setForm] = useState({ binId: preselectedBinId || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.binId) {
      setError("Please select a bin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(form);
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
          <h2 className="text-lg font-bold text-slate-800">Assign Bin</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Select Bin</label>
            <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.binId} onChange={e => set("binId", e.target.value)}>
              <option value="">Choose bin...</option>
              {bins.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400">This calls PATCH /api/clients/me/assign-bin for the logged-in client.</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
            {loading ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold z-[100] ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      <span className="text-white">
        {type === "success" ? <IconCheck className="h-4 w-4" /> : <IconX className="h-4 w-4" />}
      </span>
      {message}
    </div>
  );
}

// ─── Map Component ─────────────────────────────────────────────────────────
function MapView({ bins, onBinClick, selectedBin, onAssign, onMarkPickedUp, canAssign, canApprove }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
  const [status, setStatus] = useState(() => (apiKey ? "loading" : "error"));
  const [error, setError] = useState(() => (apiKey ? null : "Missing Google Maps API key."));
  const defaultCenter = { lat: 9.0765, lng: 7.3986 };

  const binsWithCoords = bins.filter((bin) => Number.isFinite(bin.lat) && Number.isFinite(bin.lng));
  const missingCoords = bins.length - binsWithCoords.length;

  useEffect(() => {
    let cancelled = false;
    if (!apiKey) return;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || mapInstanceRef.current || !mapRef.current) return;
        mapInstanceRef.current = new maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err.message || "Failed to load map.");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (status !== "ready" || !mapInstanceRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const markers = markersRef.current;

    markers.forEach((marker) => marker.setMap(null));
    markers.clear();

    const bounds = new maps.LatLngBounds();

    binsWithCoords.forEach((bin) => {
      const isSelected = selectedBin?.id === bin.id;
      const position = { lat: bin.lat, lng: bin.lng };
      const levelColor = getFillColor(bin.level);
      const marker = new maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: `${bin.name} (${bin.level}%)`,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: isSelected ? 9 : 7,
          fillColor: bin.type === "recyclable" ? "#2563eb" : "#16a34a",
          fillOpacity: 0.9,
          strokeColor: isSelected ? "#f59e0b" : levelColor,
          strokeWeight: isSelected ? 3 : 2,
        },
      });
      marker.addListener("click", () => onBinClick(bin));
      markers.set(bin.id, marker);
      bounds.extend(position);
    });

    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { top: 48, bottom: 48, left: 48, right: 48 });
    }
  }, [binsWithCoords, selectedBin, status, onBinClick]);

  useEffect(() => {
    if (status !== "ready" || !mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const maps = window.google.maps;
    const handleResize = () => {
      maps.event.trigger(map, "resize");
      if (!binsWithCoords.length) {
        map.setCenter(defaultCenter);
        map.setZoom(7);
      }
    };
    const timeoutId = window.setTimeout(handleResize, 150);
    let observer;
    if (typeof ResizeObserver !== "undefined" && mapRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(mapRef.current);
    }
    return () => {
      window.clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [status, binsWithCoords.length, defaultCenter]);

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
      <div ref={mapRef} className="absolute inset-0" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
          Loading Google Maps...
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 text-sm text-slate-500 px-6 text-center">
          <p className="font-semibold text-slate-700">Map unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {status === "ready" && binsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 bg-white/70">
          No bin locations yet. Add client coordinates to see bins on the map.
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs">
        <p className="font-bold text-slate-700">CleanStreak Coverage</p>
        <p className="text-slate-400">{binsWithCoords.length} mapped, {missingCoords} missing</p>
      </div>

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow space-y-1.5 text-xs">
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-blue-500" /><span className="text-slate-600">Recyclable</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-green-500" /><span className="text-slate-600">Perishable</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-400" /><span className="text-slate-600">Full (80%+)</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-orange-400" /><span className="text-slate-600">Pickup req.</span></div>
      </div>

      {selectedBin && (
        <BinDetailPopup
          bin={selectedBin}
          onClose={() => onBinClick(null)}
          onAssign={onAssign}
          onMarkPickedUp={onMarkPickedUp}
          canAssign={canAssign}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [bins, setBins] = useState([]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignBinId, setAssignBinId] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 768 : true));
  const [pickupRequests, setPickupRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState(() => readStoredValue("cs_token"));
  const [role, setRole] = useState(() => readStoredValue("cs_role"));
  const [userId, setUserId] = useState(() => readStoredValue("cs_user_id"));
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const selectedBin = bins.find((bin) => bin.id === selectedBinId) || null;

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_role");
    localStorage.removeItem("cs_user_id");
    setToken("");
    setRole("");
    setUserId("");
    setBins([]);
    setPickupRequests([]);
    setSelectedBinId(null);
    setLoadError("");
    setLastUpdated(null);
    setAuthError("Session expired. Please sign in again.");
  }, []);

  const refreshData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");

    try {
      const [binsResponse, pickupResponse, clientsResponse] = await Promise.all([
        getBins(token, { skip: 0, limit: 200 }),
        getPickupRequests(token, { skip: 0, limit: 200 }),
        role === "admin" ? getClients(token, { skip: 0, limit: 200 }) : Promise.resolve([]),
      ]);

      const binsById = new Map(binsResponse.map((bin) => [String(bin.bin_id), bin]));
      const pendingRequests = pickupResponse.filter((req) => req.status === "pending");
      const requestByBinId = new Map(pendingRequests.map((req) => [String(req.bin_id), req]));
      const clientByBinId = new Map(
        clientsResponse
          .filter((client) => client.bin_id)
          .map((client) => [String(client.bin_id), client])
      );

      const mappedBins = binsResponse.map((bin) => {
        const binId = String(bin.bin_id);
        const client = clientByBinId.get(binId);
        const request = requestByBinId.get(binId);
        const requestLat = parseCoord(request?.latitude ?? request?.lat ?? request?.location?.lat ?? request?.pickup_latitude ?? request?.pickup_lat);
        const requestLng = parseCoord(request?.longitude ?? request?.lng ?? request?.location?.lng ?? request?.pickup_longitude ?? request?.pickup_lng);
        const clientLat = parseCoord(client?.latitude ?? client?.lat);
        const clientLng = parseCoord(client?.longitude ?? client?.lng);
        const binLat = parseCoord(bin?.latitude ?? bin?.lat);
        const binLng = parseCoord(bin?.longitude ?? bin?.lng);
        const resolvedLat = requestLat ?? clientLat ?? binLat;
        const resolvedLng = requestLng ?? clientLng ?? binLng;

        return {
          id: binId,
          name: formatBinName(binId),
          type: bin.bin_type,
          level: bin.bin_level,
          lat: resolvedLat,
          lng: resolvedLng,
          address: client?.address || "No address",
          client: client
            ? { id: client.id, label: client.phone ? client.phone : `Client #${client.id}` }
            : null,
          lastEmptied: null,
          pickupRequest: Boolean(request),
          pickupRequestId: request?.id || null,
          status: "active",
        };
      });

      const mappedPickup = pickupResponse.map((req) => {
        const bin = binsById.get(String(req.bin_id));
        return {
          id: req.id,
          binId: req.bin_id,
          binName: formatBinName(req.bin_id),
          type: bin?.bin_type || "recyclable",
          level: req.level,
          address: req.address,
          agent: req.client_name || req.client_phone || "Client",
          status: req.status,
          createdAt: req.created_at,
        };
      });

      setBins(mappedBins);
      setPickupRequests(mappedPickup);
      setLastUpdated(new Date());
    } catch (e) {
      if (e?.status === 401) {
        handleUnauthorized();
        return;
      }
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, role, handleUnauthorized]);

  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => refreshData(), 0);
    return () => clearTimeout(t);
  }, [token, refreshData]);

  const handleLogin = async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await login(email, password);
      const accessToken = data?.access_token || data?.token || data?.accessToken;
      if (!accessToken) {
        throw new Error("Login response missing access token.");
      }
      const tokenType = String(data?.token_type || data?.tokenType || "").trim();
      const combinedToken = tokenType ? `${tokenType} ${accessToken}` : accessToken;

      setToken(combinedToken);
      setRole(data.role || "");
      setUserId(String(data.user_id || ""));
      localStorage.setItem("cs_token", combinedToken);
      localStorage.setItem("cs_role", data.role || "");
      localStorage.setItem("cs_user_id", String(data.user_id || ""));
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_role");
    localStorage.removeItem("cs_user_id");
    setToken("");
    setRole("");
    setUserId("");
    setBins([]);
    setPickupRequests([]);
    setSelectedBinId(null);
    setLoadError("");
    setLastUpdated(null);
  };

  const filteredBins = bins.filter(b => {
    const q = searchQuery.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !b.address.toLowerCase().includes(q)) return false;
    if (filter === "recyclable") return b.type === "recyclable";
    if (filter === "perishable") return b.type === "perishable";
    if (filter === "full") return b.level >= 80;
    if (filter === "full-recyclable") return b.type === "recyclable" && b.level >= 80;
    if (filter === "full-perishable") return b.type === "perishable" && b.level >= 80;
    if (filter === "pickup") return b.pickupRequest;
    if (filter === "unassigned") return !b.client;
    return true;
  });

  const stats = {
    total: bins.length,
    recyclable: bins.filter(b => b.type === "recyclable").length,
    perishable: bins.filter(b => b.type === "perishable").length,
    full: bins.filter(b => b.level >= 80).length,
    pickup: bins.filter(b => b.pickupRequest).length,
    unassigned: bins.filter(b => !b.client).length,
  };

  const attentionBins = bins.filter(b => b.level >= 70 || b.pickupRequest).sort((a, b) => b.level - a.level);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const navItems = [
    { name: "Dashboard", icon: IconHome },
    { name: "Map View", icon: IconMap },
    { name: "Bins", icon: IconTrash },
    { name: "Pickup Requests", icon: IconTruck },
    { name: "Users / Agents", icon: IconUsers },
    { name: "Reports", icon: IconChart },
    { name: "Alerts", icon: IconBell },
    { name: "Settings", icon: IconSettings },
  ];

  const handleBinClick = (bin) => setSelectedBinId(bin?.id === selectedBinId ? null : bin?.id || null);

  const handleCreate = async (form) => {
    if (!token) return;
    try {
      await createBin(token, { bin_id: form.binId, bin_type: form.binType });
      await refreshData();
      showToast(`${formatBinName(form.binId)} created successfully`);
    } catch (e) {
      if (e?.status === 401) {
        handleUnauthorized();
        return;
      }
      showToast(e.message, "error");
      throw e;
    }
  };

  const handleAssign = async (form) => {
    if (!token) return;
    try {
      await assignBin(token, form.binId);
      await refreshData();
      showToast(`Bin ${formatBinName(form.binId)} assigned`);
    } catch (e) {
      if (e?.status === 401) {
        handleUnauthorized();
        return;
      }
      showToast(e.message, "error");
      throw e;
    }
  };

  const handleMarkPickedUp = async (bin) => {
    if (!token || !bin.pickupRequestId) {
      showToast("No pending pickup request for this bin.", "error");
      return;
    }
    try {
      await approvePickup(token, bin.pickupRequestId);
      await refreshData();
      setSelectedBinId(null);
      showToast(`${bin.name} pickup approved`);
    } catch (e) {
      if (e?.status === 401) {
        handleUnauthorized();
        return;
      }
      showToast(e.message, "error");
    }
  };

  const openAssign = (bin) => { setAssignBinId(bin?.id || null); setShowAssign(true); };

  const canCreateBin = role === "client";
  const canAssignBin = role === "client";
  const canApprovePickup = role === "admin" || role === "pickup";

  if (!token) {
    return <LoginScreen onLogin={handleLogin} loading={authLoading} error={authError} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          aria-label="Close sidebar"
        />
      )}
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarOpen ? "md:w-60" : "md:w-16"} fixed inset-y-0 left-0 w-64 transition-transform duration-300 md:translate-x-0 md:static flex-shrink-0 bg-white border-r border-slate-100 flex flex-col shadow-sm z-30`}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white flex-shrink-0">
            <IconRecycle className="h-4 w-4" />
          </div>
          {sidebarOpen && <div><p className="font-extrabold text-slate-800 text-sm tracking-tight">CleanStreak</p><p className="text-xs text-slate-400">Admin Portal</p></div>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            return (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === item.name ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
            >
              <span className="text-base flex-shrink-0">
                <ItemIcon className="h-5 w-5" />
              </span>
              {sidebarOpen && <span className="truncate">{item.name}</span>}
              {sidebarOpen && item.name === "Alerts" && stats.full > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{stats.full}</span>
              )}
            </button>
          );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 ${!sidebarOpen && "justify-center"}`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
            {sidebarOpen && (
              <div>
                <p className="text-xs font-semibold text-slate-700">{role || "User"}</p>
                <p className="text-xs text-slate-400">User {userId || "-"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="min-h-[4rem] bg-white border-b border-slate-100 flex flex-wrap items-center px-5 gap-3 flex-shrink-0 z-10 shadow-sm">
          <button onClick={() => setSidebarOpen((s) => !s)} className="text-slate-400 hover:text-slate-600 text-xl p-1 rounded-lg hover:bg-slate-50">
            <span className="sr-only">Toggle sidebar</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <div className="w-full md:w-auto md:flex-1 md:max-w-sm relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search bins, locations..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="w-full md:w-auto md:ml-auto flex items-center gap-3 flex-wrap justify-end">
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-500">
              <IconBell className="h-5 w-5" />
              {stats.pickup > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">A</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 leading-none">{role || "User"}</p>
                <p className="text-xs text-slate-400">User {userId || "-"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-5 space-y-5">
          {/* Page title + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">{activeNav}</h1>
              <p className="text-sm text-slate-400 mt-0.5">CleanStreak Waste Management </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateBin && (
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-sm w-full sm:w-auto">
                  <IconPlus className="h-4 w-4" />
                  Create Bin
                </button>
              )}
              {canAssignBin && (
                <button onClick={() => { setAssignBinId(null); setShowAssign(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-sm w-full sm:w-auto">
                  <IconUser className="h-4 w-4" />
                  Assign Bin
                </button>
              )}
            </div>
          </div>

          {loadError && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              Failed to load data: {loadError}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard icon={<IconTrash className="h-5 w-5 sm:h-6 sm:w-6" />} label="Total Bins" value={stats.total} color="blue" />
            <StatCard icon={<IconRecycle className="h-5 w-5 sm:h-6 sm:w-6" />} label="Recyclable" value={stats.recyclable} color="blue" />
            <StatCard icon={<IconLeaf className="h-5 w-5 sm:h-6 sm:w-6" />} label="Perishable" value={stats.perishable} color="green" />
            <StatCard icon={<IconAlert className="h-5 w-5 sm:h-6 sm:w-6" />} label="Full Bins" value={stats.full} color="red" sub="80%+ capacity" />
            <StatCard icon={<IconTruck className="h-5 w-5 sm:h-6 sm:w-6" />} label="Pickup Req." value={stats.pickup} color="orange" sub="pending" />
            <StatCard icon={<IconUsers className="h-5 w-5 sm:h-6 sm:w-6" />} label="Unassigned" value={stats.unassigned} color="gray" />
          </div>

          {/* Map + Side Panel */}
          <div className="flex flex-col lg:flex-row gap-4 lg:h-[480px]">
            {/* Map */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Filter bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
                {[
                  ["all", "All Bins"],
                  ["recyclable", "Recyclable"],
                  ["perishable", "Perishable"],
                  ["full", "Full"],
                  ["full-recyclable", "Full Blue"],
                  ["full-perishable", "Full Green"],
                  ["pickup", "Pickup Req."],
                  ["unassigned", "Unassigned"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === val ? "bg-slate-800 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}
                  >
                    {label}
                    {val !== "all" && (
                      <span className="ml-1.5 opacity-70">
                        ({val === "recyclable" ? stats.recyclable : val === "perishable" ? stats.perishable : val === "full" ? stats.full : val === "pickup" ? stats.pickup : val === "unassigned" ? stats.unassigned : bins.filter(b => (val === "full-recyclable" ? b.type === "recyclable" && b.level >= 80 : b.type === "perishable" && b.level >= 80)).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex-1 relative h-[320px] sm:h-[360px] lg:h-full min-h-[320px] sm:min-h-[360px]">
                <MapView
                  bins={filteredBins}
                  onBinClick={handleBinClick}
                  selectedBin={selectedBin}
                  onAssign={openAssign}
                  onMarkPickedUp={handleMarkPickedUp}
                  canAssign={canAssignBin}
                  canApprove={canApprovePickup}
                />
              </div>
            </div>

            {/* Right panel */}
            <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
              {/* Recent Pickup Requests */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-700 text-sm">Pickup Requests</p>
                  <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{pickupRequests.filter(r => r.status === "pending").length} pending</span>
                </div>
                <div className="space-y-2">
                  {pickupRequests.slice(0, 5).map(req => (
                    <div key={req.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${req.type === "recyclable" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                        {req.type === "recyclable" ? <IconRecycle className="h-4 w-4" /> : <IconLeaf className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{req.binName}</p>
                        <p className="text-xs text-slate-400 truncate">{req.address}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${req.status === "pending" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>{req.status}</span>
                          <span className="text-xs text-slate-400">{req.level}%</span>
                          <span className="text-xs text-slate-400 ml-auto">{timeAgo(req.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pickupRequests.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-6">No pickup requests found.</div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <p className="font-bold text-slate-700 text-sm mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    canCreateBin ? { label: "Create Bin", icon: IconPlus, action: () => setShowCreate(true) } : null,
                    canAssignBin ? { label: "Assign Bin", icon: IconUser, action: () => { setAssignBinId(null); setShowAssign(true); } } : null,
                    { label: "Pickup Queue", icon: IconTruck, action: () => setActiveNav("Pickup Requests") },
                    { label: "Refresh Data", icon: IconRefresh, action: refreshData },
                  ].filter(Boolean).map((a) => {
                    const ActionIcon = a.icon;
                    return (
                      <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <span className="text-slate-500">
                          <ActionIcon className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-semibold text-slate-600">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
                {lastUpdated && (
                  <p className="text-[11px] text-slate-400 mt-3">Last updated {timeAgo(lastUpdated.toISOString())}</p>
                )}
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
                    {["Bin ID", "Type", "Fill Level", "Location", "Assigned Agent", "Status", "Action"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attentionBins.map((bin, i) => (
                    <tr key={bin.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                      <td className="px-5 py-3">
                        <button onClick={() => handleBinClick(bin)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">{bin.name}</button>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bin.type === "recyclable" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {bin.type === "recyclable" ? <IconRecycle className="h-4 w-4" /> : <IconLeaf className="h-4 w-4" />}
                          <span>{bin.type === "recyclable" ? "Recyclable" : "Perishable"}</span>
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
                      <td className="px-5 py-3 text-slate-600 max-w-[180px] truncate">{bin.address}</td>
                      <td className="px-5 py-3">
                        {bin.client ? (
                          <span className="text-slate-700 font-medium">{bin.client.label}</span>
                        ) : (
                          <span className="text-orange-500 font-semibold text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {bin.pickupRequest ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            Pickup Req.
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getFillBg(bin.level)}`}>
                            {bin.level >= 85 ? "Critical" : "High"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleBinClick(bin)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">View</button>
                          {canAssignBin && (
                            <button onClick={() => openAssign(bin)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition">Assign</button>
                          )}
                          {canApprovePickup && bin.pickupRequest && (
                            <button onClick={() => handleMarkPickedUp(bin)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition">Approve</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attentionBins.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">All bins are within normal levels</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreate && <CreateBinModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showAssign && (
        <AssignBinModal
          key={assignBinId || "assign"}
          bins={bins}
          preselectedBinId={assignBinId}
          onClose={() => { setShowAssign(false); setAssignBinId(null); }}
          onSave={handleAssign}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
