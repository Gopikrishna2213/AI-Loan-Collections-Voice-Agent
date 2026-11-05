import { useEffect, useState } from "react";
import { get, inr, webCallUrl } from "../api";
import { Card, Field, Notice, Table } from "./ui";

export default function WebCall() {
  const [customers, setCustomers] = useState(null);
  const [selected, setSelected] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [events, setEvents] = useState(null);

  useEffect(() => {
    get("/api/customers").then((r) => {
      const list = r.ok ? r.data : [];
      setCustomers(list);
      const rahul = list.find((c) => c.full_name.includes("Rahul Sharma"));
      setSelected((rahul || list[0])?.customer_id || "");
    });
  }, []);

  const customer = customers?.find((c) => c.customer_id === selected);

  const lookup = async () => {
    if (!lookupId.trim()) return;
    const r = await get("/api/events", { call_id: lookupId.trim() });
    setEvents(r.ok ? r.data : []);
  };

  if (customers && !customers.length) return <Notice tone="warn">No customers loaded. Is the backend running?</Notice>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card
        title="Start a live voice call"
        subtitle="Opens a real Vapi call in a new tab, served by the backend over HTTPS. Allow microphone access when asked."
      >
        <div className="space-y-5">
          <Field label="Customer for this call">
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {customers?.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.full_name} ({c.phone})</option>
              ))}
            </select>
          </Field>

          {customer && (
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Customer", customer.full_name], ["Outstanding", inr(customer.overdue_amount_rupees)], ["Days past due", customer.days_past_due]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/70 p-3">
                  <div className="truncate text-base font-bold text-slate-900">{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-600">
            Maya won't share any account details until the caller confirms their full name, date of birth and the last 4 digits of the loan account.
          </p>

          <a
            href={customer ? webCallUrl(customer.customer_id) : undefined}
            target="_blank" rel="noreferrer"
            className={`btn-primary w-full ${customer ? "" : "pointer-events-none opacity-50"}`}
          >
            Open voice call
          </a>
        </div>
      </Card>

      <Card title="Find a call's activity" subtitle="Paste the Call ID shown on the call page to see what the agent did.">
        <div className="flex gap-3">
          <input className="input" placeholder="Call ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && lookup()} />
          <button className="btn-primary shrink-0" onClick={lookup}>Show events</button>
        </div>
        {events && (
          <div className="mt-4">
            <Table
              empty="No events for that call yet. The agent may not have used a tool."
              rows={events}
              columns={[
                { key: "created_at", label: "Time" },
                { key: "kind", label: "Action" },
                { key: "detail", label: "Detail" },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
