import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import PasswordInput from '../../ui/PasswordInput';
import SectionCard from '../_shared/SectionCard';
import FieldRow from '../_shared/FieldRow';

export function PasswordChangeForm({ onSubmit, loading, error }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <SectionCard title="Change password">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ currentPassword, newPassword });
        }}
      >
        <PasswordInput label="Current password" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <PasswordInput label="New password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Update password</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function ActiveSessionsList({ sessions = [], onRevoke }) {
  return (
    <SectionCard title="Active sessions" subtitle="Devices currently signed in.">
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{s.device}</div>
              <div className="text-xs text-gray-500">{s.location} • {s.lastActive}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onRevoke?.(s)}>Sign out</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function LoginHistoryTable({ rows = [] }) {
  return (
    <SectionCard title="Login history">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">IP</th>
              <th className="py-2 pr-4">Device</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((r, idx) => (
              <tr key={r.id ?? idx}>
                <td className="py-2 pr-4 text-gray-900">{r.time}</td>
                <td className="py-2 pr-4 text-gray-700">{r.ip}</td>
                <td className="py-2 pr-4 text-gray-700">{r.device}</td>
                <td className="py-2 pr-4 text-gray-700">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function SecurityQuestionsSetup({ questions = [], onSave }) {
  return (
    <SectionCard title="Security questions" subtitle="Optional recovery questions.">
      <div className="space-y-3">
        {questions.map((q) => (
          <FieldRow key={q.id} label={q.question} value={q.answer ? '••••••' : 'Not set'} right={q.action} />
        ))}
        <div className="flex justify-end">
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function BackupCodesDisplay({ codes = [], onRegenerate }) {
  return (
    <SectionCard title="Backup codes" subtitle="Store these somewhere safe.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {codes.map((c) => (
          <div key={c} className="rounded-md border border-gray-200 bg-gray-50 p-2 font-mono text-sm text-gray-800">{c}</div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onRegenerate}>Regenerate</Button>
      </div>
    </SectionCard>
  );
}

export function DeviceManagementList({ devices = [], onRemove }) {
  return (
    <SectionCard title="Devices" subtitle="Manage remembered devices.">
      <div className="space-y-3">
        {devices.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{d.name}</div>
              <div className="text-xs text-gray-500">Last seen: {d.lastSeen}</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => onRemove?.(d)}>Remove</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function SecurityAuditLog({ items = [] }) {
  return (
    <SectionCard title="Security audit log">
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={it.id ?? idx} className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">{it.action}</div>
            <div className="text-xs text-gray-500 mt-1">{it.time} • {it.meta}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function TrustedDevicesList({ devices = [] }) {
  return (
    <Card className="shadow-sm">
      <div className="space-y-3">
        <div className="text-lg font-semibold text-gray-900">Trusted devices</div>
        {devices.map((d) => (
          <div key={d.id} className="text-sm text-gray-700">{d.name}</div>
        ))}
      </div>
    </Card>
  );
}
