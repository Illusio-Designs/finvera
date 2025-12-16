import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import ProgressBar from '../../ui/ProgressBar';
import SectionCard from '../_shared/SectionCard';

export function CurrentPlanCard({ planName, price, interval, features = [], onManage }) {
  return (
    <Card className="shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Current plan</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{planName || '—'}</div>
          {price ? <div className="text-sm text-gray-600 mt-1">{price}/{interval || 'mo'}</div> : null}
        </div>
        <Button variant="outline" onClick={onManage}>Manage</Button>
      </div>
      {features?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-gray-700">
          {features.map((f) => <li key={f}>• {f}</li>)}
        </ul>
      ) : null}
    </Card>
  );
}

export function PlanComparisonTable({ plans = [], onSelect }) {
  return (
    <SectionCard title="Plans" subtitle="Compare plans and choose the best fit.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pr-4">Plan</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">Key features</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="py-3 pr-4 font-semibold text-gray-900">{p.name}</td>
                <td className="py-3 pr-4 text-gray-700">{p.price}</td>
                <td className="py-3 pr-4 text-gray-700">{p.summary}</td>
                <td className="py-3 pr-4 text-right">
                  <Button size="sm" onClick={() => onSelect?.(p)}>Select</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function UpgradeDowngradeModal({ isOpen, onClose, onConfirm, selectedPlan }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm plan change" size="sm">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          You’re about to switch to <span className="font-semibold text-gray-900">{selectedPlan?.name || 'this plan'}</span>.
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm?.(selectedPlan)}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PaymentMethodForm({ initial = {}, onSubmit, loading }) {
  const [name, setName] = useState(initial.name || '');
  const [cardNumber, setCardNumber] = useState(initial.cardNumber || '');
  const [exp, setExp] = useState(initial.exp || '');
  const [cvc, setCvc] = useState(initial.cvc || '');

  return (
    <SectionCard title="Payment method">
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ name, cardNumber, exp, cvc });
        }}
      >
        <Input label="Name on card" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Card number" name="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
        <Input label="Expiry" name="exp" placeholder="MM/YY" value={exp} onChange={(e) => setExp(e.target.value)} />
        <Input label="CVC" name="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function SavedPaymentMethodsList({ methods = [], onRemove, onDefault }) {
  return (
    <SectionCard title="Saved payment methods">
      <div className="space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{m.brand} •••• {m.last4}</div>
              <div className="text-xs text-gray-500">Expires {m.exp}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onDefault?.(m)}>Make default</Button>
              <Button variant="danger" size="sm" onClick={() => onRemove?.(m)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function BillingHistoryTable({ invoices = [], onDownload }) {
  return (
    <SectionCard title="Billing history">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="py-3 pr-4 text-gray-900">{inv.date}</td>
                <td className="py-3 pr-4 text-gray-700">{inv.amount}</td>
                <td className="py-3 pr-4 text-gray-700">{inv.status}</td>
                <td className="py-3 pr-4 text-right">
                  <Button size="sm" variant="outline" onClick={() => onDownload?.(inv)}>Download</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function InvoiceDownloadLinks({ invoices = [], onDownload }) {
  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <button key={inv.id} className="text-sm text-primary-700 hover:underline" onClick={() => onDownload?.(inv)}>
          {inv.label || `Invoice ${inv.id}`}
        </button>
      ))}
    </div>
  );
}

export function UsageMeterProgressBar({ used = 0, limit = 100, label = 'Usage' }) {
  return <ProgressBar value={used} max={limit} label={label} />;
}

export function BillingCycleSelector({ value, onChange }) {
  return (
    <Select
      label="Billing cycle"
      name="billingCycle"
      value={value}
      onChange={onChange}
      options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }]}
    />
  );
}

export function PromoCodeInput({ value, onChange, onApply }) {
  return (
    <div className="flex items-end gap-2">
      <Input label="Promo code" name="promo" value={value} onChange={onChange} />
      <Button variant="outline" onClick={onApply}>Apply</Button>
    </div>
  );
}

export function TaxInformationForm({ initial = {}, onSubmit, loading }) {
  const [taxId, setTaxId] = useState(initial.taxId || '');
  const [company, setCompany] = useState(initial.company || '');

  return (
    <SectionCard title="Tax information">
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ company, taxId });
        }}
      >
        <Input label="Company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input label="Tax ID" name="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function CancelSubscriptionModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel subscription" size="sm">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">Are you sure you want to cancel? You can reactivate anytime.</div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Keep subscription</Button>
          <Button variant="danger" onClick={onConfirm}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export function ReactivateSubscriptionButton({ onClick, loading }) {
  return (
    <Button onClick={onClick} loading={loading}>
      Reactivate subscription
    </Button>
  );
}
