import { useEffect, useState } from "react";

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`glass p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 max-w-prose text-sm text-slate-600">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, tone = "violet" }) {
  const tones = {
    violet: "from-violet-500 to-fuchsia-500",
    sky: "from-sky-500 to-cyan-400",
    amber: "from-amber-500 to-orange-400",
    emerald: "from-emerald-500 to-teal-400",
  };
  return (
    <div className="glass flex items-center gap-4 p-4">
      <span className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${tones[tone]}`} />
      <div>
        <div className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs font-medium text-slate-600">{label}</div>
      </div>
    </div>
  );
}

const BADGE = {
  in_progress: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  failed_verification: "bg-rose-100 text-rose-800",
  escalated: "bg-orange-100 text-orange-800",
  closed: "bg-slate-200 text-slate-700",
  default: "bg-violet-100 text-violet-800",
};

export function Badge({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[value] || BADGE.default}`}>
      {String(value).replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

export function Table({ columns, rows, empty = "Nothing here yet.", rowKey }) {
  if (!rows?.length) return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold text-slate-500">
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? r[rowKey] : i} className="border-t border-white/70 hover:bg-white/50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2.5 text-slate-800">
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  const tones = {
    info: "border-sky-200 bg-sky-50/80 text-sky-900",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    warn: "border-amber-200 bg-amber-50/80 text-amber-900",
    error: "border-rose-200 bg-rose-50/80 text-rose-900",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Json({ data }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-xl bg-slate-900/90 p-3 text-xs leading-relaxed text-emerald-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// Fetches on mount and every `interval` ms when `auto` is true.
export function usePolling(loader, auto, interval = 4000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    loader();
    if (!auto) return;
    const id = setInterval(loader, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, tick]);
  return () => setTick((t) => t + 1);
}
