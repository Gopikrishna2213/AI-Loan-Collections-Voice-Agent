import { useState } from "react";
import Monitor from "./components/Monitor.jsx";
import WebCall from "./components/WebCall.jsx";
import Simulator from "./components/Simulator.jsx";
import Customers from "./components/Customers.jsx";
import About from "./components/About.jsx";

const TABS = [
  { id: "monitor", label: "Live monitor", view: Monitor },
  { id: "webcall", label: "Web call", view: WebCall },
  { id: "simulator", label: "Call simulator", view: Simulator },
  { id: "customers", label: "Customers", view: Customers },
  { id: "about", label: "Design notes", view: About },
];

export default function App() {
  const [tab, setTab] = useState("monitor");
  const View = TABS.find((t) => t.id === tab).view;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-extrabold text-white shadow-lg shadow-violet-500/30">M</div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Maya</h1>
            <p className="text-sm text-slate-600">Kapture Finance collections agent</p>
          </div>
        </div>
        <nav className="glass flex max-w-full gap-1 overflow-x-auto p-1.5" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                tab === t.id ? "bg-white text-violet-700 shadow" : "text-slate-600 hover:bg-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main><View /></main>
    </div>
  );
}
