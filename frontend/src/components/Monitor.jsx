import { useState } from "react";
import { get, inr } from "../api";
import { Badge, Card, Notice, Stat, Table, usePolling } from "./ui";

const when = (s) => (s ? new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function Monitor() {
  const [data, setData] = useState({ calls: [], ptps: [], links: [], events: [] });
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(true);

  const load = async () => {
    const [calls, ptps, links, events] = await Promise.all([
      get("/api/calls"), get("/api/ptps"), get("/api/payment_links"), get("/api/events"),
    ]);
    const failed = [calls, ptps, links, events].find((r) => !r.ok);
    setError(failed ? "Can't reach the backend. Check that FastAPI is running on port 8000." : "");
    setData({
      calls: calls.ok ? calls.data : [], ptps: ptps.ok ? ptps.data : [],
      links: links.ok ? links.data : [], events: events.ok ? events.data : [],
    });
  };
  const refresh = usePolling(load, auto);

  const promised = data.ptps.reduce((s, p) => s + (p.amount_rupees || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Calls" value={data.calls.length} tone="violet" />
          <Stat label="Verified" value={data.calls.filter((c) => c.status === "verified").length} tone="emerald" />
          <Stat label="Escalated" value={data.calls.filter((c) => c.status === "escalated").length} tone="amber" />
          <Stat label="Total promised" value={inr(promised)} tone="sky" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-violet-600" />
          Refresh every 4 seconds
        </label>
        <button className="btn-soft" onClick={refresh}>Refresh now</button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <Card title="Calls">
        <Table
          rowKey="call_id"
          empty="No calls yet. Run one from Call simulator or Web call."
          rows={data.calls}
          columns={[
            { key: "call_id", label: "Call ID" },
            { key: "customer_id", label: "Customer" },
            { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
            { key: "disposition", label: "Disposition", render: (r) => <Badge value={r.disposition} /> },
            { key: "verification_attempts", label: "Verify attempts" },
            { key: "callback", label: "Callback", render: (r) => (r.callback_date ? `${r.callback_date} ${r.callback_time || ""}` : "—") },
            { key: "created_at", label: "Started", render: (r) => when(r.created_at) },
          ]}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Promises to pay">
          <Table
            rowKey="ptp_id"
            empty="No promises logged yet."
            rows={data.ptps}
            columns={[
              { key: "customer_id", label: "Customer" },
              { key: "amount_rupees", label: "Amount", render: (r) => inr(r.amount_rupees) },
              { key: "due_date", label: "Due" },
              { key: "method", label: "Method" },
            ]}
          />
        </Card>
        <Card title="Payment links">
          <Table
            rowKey="link_id"
            empty="No payment links sent yet."
            rows={data.links}
            columns={[
              { key: "customer_id", label: "Customer" },
              { key: "amount_rupees", label: "Amount", render: (r) => inr(r.amount_rupees) },
              { key: "url", label: "Link", render: (r) => <a className="text-violet-700 underline" href={r.url} target="_blank" rel="noreferrer">Open</a> },
            ]}
          />
        </Card>
      </div>

      <Card title="Event log" subtitle="The 200 most recent actions the agent took.">
        <Table
          empty="No events yet."
          rows={data.events}
          columns={[
            { key: "created_at", label: "Time", render: (r) => when(r.created_at) },
            { key: "call_id", label: "Call ID" },
            { key: "kind", label: "Action", render: (r) => <Badge value={r.kind} /> },
            { key: "detail", label: "Detail" },
          ]}
        />
      </Card>
    </div>
  );
}
