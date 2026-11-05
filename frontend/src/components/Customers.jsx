import { useEffect, useState } from "react";
import { get, post, del, inr, errorText } from "../api";
import { Badge, Card, Field, Notice, Table } from "./ui";

const LOAN_TYPES = ["Personal Loan", "Two-Wheeler Loan", "Home Loan", "Business Loan", "Credit Card"];
const blank = { full_name: "", phone: "", dob: "1990-01-01", last4: "", loan_type: LOAN_TYPES[0], overdue_amount_rupees: 5000, days_past_due: 10, min_settlement_pct: 100 };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState(null);

  const load = async () => { const r = await get("/api/customers"); setCustomers(r.ok ? r.data : []); };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || form.last4.length !== 4) {
      setMsg({ tone: "error", text: "Enter a name, a phone number and exactly 4 digits for the loan account." });
      return;
    }
    const r = await post("/api/customers", {
      ...form,
      overdue_amount_rupees: Number(form.overdue_amount_rupees),
      days_past_due: Number(form.days_past_due),
      min_settlement_pct: Number(form.min_settlement_pct),
    });
    if (r.ok) { setMsg({ tone: "success", text: `Added ${form.full_name} (${r.data.customer_id}).` }); setForm(blank); load(); }
    else setMsg({ tone: "error", text: r.status === 409 ? errorText(r.data) : `Couldn't add customer: ${errorText(r.data)}` });
  };

  const remove = async (c) => {
    if (!window.confirm(`Remove ${c.full_name}? Past calls and promises stay on record.`)) return;
    const r = await del(`/api/customers/${c.customer_id}`);
    setMsg(r.ok ? { tone: "success", text: `Removed ${c.full_name}.` } : { tone: "error", text: errorText(r.data) });
    load();
  };

  return (
    <div className="space-y-6">
      <Card
        title="Loan accounts"
        subtitle="The minimum is the lowest amount the backend accepts as a promise to pay. The agent can't override it."
      >
        <Table
          rowKey="customer_id"
          empty="No customers loaded. Is the backend running?"
          rows={customers}
          columns={[
            { key: "full_name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "loan_type", label: "Loan" },
            { key: "overdue", label: "Overdue EMI", render: (r) => inr(r.overdue_amount_rupees) },
            { key: "days_past_due", label: "Days past due" },
            { key: "min", label: "Minimum accepted", render: (r) => `${inr(Math.floor((r.overdue_amount_rupees * r.min_settlement_pct) / 100))} (${r.min_settlement_pct}%)` },
            { key: "cease_contact", label: "Do not call", render: (r) => (r.cease_contact ? <Badge value="escalated" /> : <span className="text-slate-500">No</span>) },
            { key: "x", label: "", render: (r) => <button className="btn-danger !px-3 !py-1.5" onClick={() => remove(r)}>Remove</button> },
          ]}
        />
      </Card>

      <Card title="Add a customer" subtitle="Adds a test account to the backend. This is an ops action, not something Maya does mid-call.">
        <form onSubmit={add} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={form.full_name} onChange={set("full_name")} /></Field>
            <Field label="Phone (unique)"><input className="input" placeholder="+919800011122" value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Date of birth"><input className="input" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={set("dob")} /></Field>
            <Field label="Loan account, last 4 digits"><input className="input" maxLength={4} value={form.last4} onChange={set("last4")} /></Field>
            <Field label="Loan type">
              <select className="input" value={form.loan_type} onChange={set("loan_type")}>{LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Overdue EMI (₹)"><input className="input" type="number" min="1" step="100" value={form.overdue_amount_rupees} onChange={set("overdue_amount_rupees")} /></Field>
            <Field label="Days past due"><input className="input" type="number" min="0" value={form.days_past_due} onChange={set("days_past_due")} /></Field>
            <Field label={`Minimum settlement: ${form.min_settlement_pct}%`}>
              <input className="mt-2 w-full accent-violet-600" type="range" min="10" max="100" step="5" value={form.min_settlement_pct} onChange={set("min_settlement_pct")} />
            </Field>
          </div>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <button className="btn-primary" type="submit">Add customer</button>
        </form>
      </Card>
    </div>
  );
}
