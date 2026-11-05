import { useEffect, useState } from "react";
import { get, post, inr, errorText } from "../api";
import { Card, Field, Json, Notice } from "./ui";

const DISPOSITIONS = [
  "PROMISE_TO_PAY", "PAYMENT_LINK_SENT", "ALREADY_PAID", "DISPUTE", "HARDSHIP", "CALLBACK_REQUESTED",
  "DO_NOT_CALL", "WRONG_PERSON", "ESCALATED", "NO_RESPONSE", "FAILED_VERIFICATION", "OTHER",
];
const METHODS = ["upi", "debit_card", "bank_transfer", "netbanking", "other"];
const EDGE_CASES = [
  ["dispute_debt", "Dispute debt", "Caller says debt isn't theirs"],
  ["hardship", "Hardship claim", "Caller cites job loss"],
  ["wrong_person", "Wrong person", "Wrong number reached"],
  ["hostile", "Hostile caller", "Caller is abusive"],
  ["request_human", "Request human", "Caller wants a person"],
  ["cease_contact", "Do not call", "Caller invokes do-not-call"],
  ["voicemail", "Voicemail", "No answer, voicemail reached"],
  ["already_paid", "Already paid", "Caller claims the EMI was already paid"],
];

const newCallId = () => `sim_${Math.floor(Date.now() / 1000)}`;
const isoDate = (offsetDays = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export default function Simulator() {
  const [callId, setCallId] = useState(newCallId);
  const [customers, setCustomers] = useState([]);
  const [pick, setPick] = useState("custom");
  const [name, setName] = useState("Someone Wrong");
  const [dob, setDob] = useState("2000-01-01");
  const [last4, setLast4] = useState("0000");
  const [verified, setVerified] = useState(null); // verify_customer result when verified
  const [log, setLog] = useState([]); // newest first
  const [offer, setOffer] = useState(0);
  const [due, setDue] = useState(isoDate(1));
  const [method, setMethod] = useState("upi");
  const [linkAmt, setLinkAmt] = useState(0);
  const [cbDate, setCbDate] = useState(isoDate(1));
  const [cbTime, setCbTime] = useState("18:00");
  const [disposition, setDisposition] = useState(DISPOSITIONS[0]);

  useEffect(() => {
    get("/api/customers").then((r) => {
      const list = r.ok ? r.data : [];
      setCustomers(list);
      const rahul = list.find((c) => c.full_name.includes("Rahul Sharma"));
      if (rahul) choose(rahul.customer_id, list);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id, list = customers) => {
    setPick(id);
    const c = list.find((x) => x.customer_id === id);
    if (c) { setName(c.full_name); setDob(c.dob); setLast4(c.last4); }
    else { setName("Someone Wrong"); setDob("2000-01-01"); setLast4("0000"); }
  };

  const record = (tool, status, data, note) =>
    setLog((l) => [{ id: Date.now() + Math.random(), tool, status, data, note }, ...l]);

  const call = async (tool, payload, interpret) => {
    const r = await post(`/tools/${tool}`, { call_id: callId, ...payload });
    record(tool, r.status, r.data, interpret ? interpret(r) : null);
    return r;
  };

  const startNew = () => { setCallId(newCallId()); setVerified(null); setLog([]); };

  const verify = async () => {
    const r = await call("verify_customer", { dob, last4 }, ({ data }) => {
      if (data.result === "verified")
        return { tone: "success", text: `Verified. ${data.loan_type} overdue EMI ${inr(data.overdue_amount_rupees)}, ${data.days_past_due} days past due. Internal floor ${inr(data.min_settlement_rupees)} is never shown to the caller.` };
      if (data.result === "verified_but_do_not_contact")
        return { tone: "warn", text: "Verified, but this account is Do-Not-Call. The agent must end the call without discussing the debt and record DO_NOT_CALL." };
      if (data.result === "failed_max_attempts")
        return { tone: "error", text: "Maximum verification attempts reached. The agent must not disclose any account info and should record FAILED_VERIFICATION." };
      if (data.result === "failed") return { tone: "warn", text: `Details didn't match. ${data.attempts_remaining} attempt left.` };
      return null;
    });
    if (r.data.result === "verified") {
      setVerified(r.data);
      setOffer(r.data.overdue_amount_rupees);
      setLinkAmt(r.data.overdue_amount_rupees);
    }
  };

  const logPtp = () =>
    call("log_promise_to_pay", { amount_rupees: Number(offer), due_date: due, method }, ({ data }) =>
      data.result === "rejected"
        ? { tone: "error", text: `Rejected. Below the approved minimum of ${inr(data.min_settlement_rupees)}. The agent should ask for more.` }
        : data.result === "logged"
        ? { tone: "success", text: "Promise logged. Next: optionally send a payment link, then record PROMISE_TO_PAY." }
        : { tone: "error", text: errorText(data) });

  const sendLink = () =>
    call("send_payment_link", { amount_rupees: Number(linkAmt) }, ({ data }) =>
      data.result === "sent" ? { tone: "success", text: `Link sent: ${data.url}` } : { tone: "error", text: errorText(data) });

  const edge = (kind, note) => call("edge_case", { kind, note }, ({ data }) =>
    kind === "already_paid"
      ? { tone: "info", text: "Flagged for payment verification and escalated. The agent must not confirm the payment itself. Record ALREADY_PAID next." }
      : data.result === "logged" ? null : { tone: "error", text: errorText(data) });

  const callback = () =>
    call("edge_case", { kind: "callback_requested", callback_date: cbDate, callback_time: cbTime, note: "Caller asked to be called back" });

  const finish = () =>
    call("mark_disposition", { disposition }, ({ status, data }) =>
      status === 403
        ? { tone: "error", text: "Blocked. This outcome needs a verified caller first." }
        : status >= 400 ? { tone: "error", text: errorText(data) }
        : { tone: "success", text: `Recorded ${disposition}. Call closed.` });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card
          title="Simulated call"
          subtitle="Fires the same tool endpoints Vapi calls during a real conversation, with no phone needed."
          action={<button className="btn-soft" onClick={startNew}>New call</button>}
        >
          <Field label="Call ID"><input className="input" value={callId} onChange={(e) => setCallId(e.target.value)} /></Field>
        </Card>

        <Card title="1. Verify identity" subtitle="No account details are used below until verification succeeds.">
          <div className="space-y-4">
            <Field label="Caller is">
              <select className="input" value={pick} onChange={(e) => choose(e.target.value)}>
                <option value="custom">Custom / wrong answers</option>
                {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.full_name} ({c.phone})</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Date of birth"><input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
              <Field label="Loan account, last 4"><input className="input" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value)} /></Field>
            </div>
            <button className="btn-primary" onClick={verify}>Verify customer</button>
          </div>
        </Card>

        <Card title="2. Negotiate a promise to pay">
          {!verified ? (
            <Notice tone="info">Verify the caller first. The backend rejects this step otherwise (HTTP 403).</Notice>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                <b>{verified.loan_type}</b> overdue EMI <b>{inr(verified.overdue_amount_rupees)}</b>, {verified.days_past_due} days past due.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Caller's offer (₹)"><input className="input" type="number" min="0" step="100" value={offer} onChange={(e) => setOffer(e.target.value)} /></Field>
                <Field label="Agreed due date"><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
                <Field label="Method">
                  <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </Field>
              </div>
              <button className="btn-primary" onClick={logPtp}>Log promise to pay</button>

              <div className="border-t border-white/80 pt-4">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Send a payment link (optional)</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1"><Field label="Amount (₹)"><input className="input" type="number" min="0" step="100" value={linkAmt} onChange={(e) => setLinkAmt(e.target.value)} /></Field></div>
                  <button className="btn-soft" onClick={sendLink}>Send link</button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Edge cases" subtitle="Trigger at any point in the call.">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {EDGE_CASES.map(([kind, label, note]) => (
              <button key={kind} className="btn-soft" onClick={() => edge(kind, note)}>{label}</button>
            ))}
          </div>
          <div className="mt-5 border-t border-white/80 pt-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Callback requested</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-36 flex-1"><Field label="Date"><input className="input" type="date" value={cbDate} onChange={(e) => setCbDate(e.target.value)} /></Field></div>
              <div className="min-w-28 flex-1"><Field label="Time"><input className="input" type="time" value={cbTime} onChange={(e) => setCbTime(e.target.value)} /></Field></div>
              <button className="btn-soft" onClick={callback}>Request callback</button>
            </div>
          </div>
        </Card>

        <Card title="3. Record the outcome" subtitle="Every call ends with exactly one disposition.">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Final disposition">
                <select className="input" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                  {DISPOSITIONS.map((d) => <option key={d} value={d}>{d.replaceAll("_", " ").toLowerCase()}</option>)}
                </select>
              </Field>
            </div>
            <button className="btn-primary" onClick={finish}>Record outcome</button>
          </div>
        </Card>
      </div>

      <aside className="lg:col-span-2">
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card title="Responses" subtitle="Newest first.">
            {!log.length ? (
              <p className="py-6 text-center text-sm text-slate-500">Run a step to see the backend response here.</p>
            ) : (
              <ul className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
                {log.map((e) => (
                  <li key={e.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>{e.tool}</span>
                      <span className={e.status >= 200 && e.status < 300 ? "text-emerald-700" : "text-rose-700"}>
                        {e.status || "network error"}
                      </span>
                    </div>
                    {e.note && <Notice tone={e.note.tone}>{e.note.text}</Notice>}
                    <Json data={e.data} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </aside>
    </div>
  );
}
