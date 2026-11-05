import { Card } from "./ui";

const POINTS = [
  ["The backend decides, not the prompt", "Reading the overdue EMI, logging a promise, sending a payment link and recording an outcome are all gated by the FastAPI backend. A confused or jailbroken model still gets a 403 or a rejection."],
  ["Verification is a hard gate", "Promises and payment links check the call's status before doing anything. Two failed attempts lock the call. Outcomes tied to a debt are refused on calls that were never verified."],
  ["The negotiation floor lives in data", "Each account has a minimum settlement percentage. The backend computes the floor and rejects anything below it."],
  ["Already paid and callbacks are first-class", "An already-paid claim is escalated for ops to verify; the agent never confirms payment itself. A callback needs both a date and a time."],
  ["Every call ends with one disposition", "The last tool call on every path records the outcome, and Live monitor reports it."],
  ["Same endpoints for demo and ops", "This app calls the exact endpoints Vapi calls, so the simulator behaves like a real phone call."],
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Why it's built this way" subtitle="Maya is a state-controlled AI voice collections agent.">
        <dl className="space-y-5">
          {POINTS.map(([t, d]) => (
            <div key={t}>
              <dt className="text-sm font-bold text-slate-900">{t}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-700">{d}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
