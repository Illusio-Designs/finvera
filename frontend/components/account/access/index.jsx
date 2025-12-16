import { useMemo, useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Badge from '../../ui/Badge';
import SectionCard from '../_shared/SectionCard';

export function PermissionMatrixTable({ roles = [], resources = [] }) {
  return (
    <SectionCard title="Permission matrix">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pr-4">Resource</th>
              {roles.map((r) => (
                <th key={r.id} className="py-2 pr-4">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resources.map((res) => (
              <tr key={res.id}>
                <td className="py-3 pr-4 font-semibold text-gray-900">{res.name}</td>
                {roles.map((r) => (
                  <td key={r.id} className="py-3 pr-4 text-gray-700">{res.permissions?.[r.id] ? '✓' : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function RoleCreationForm({ onCreate, loading }) {
  const [name, setName] = useState('');
  return (
    <SectionCard title="Create role">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate?.({ name });
        }}
      >
        <Input label="Role name" name="roleName" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" loading={loading}>Create</Button>
      </form>
    </SectionCard>
  );
}

export function CustomPermissionBuilder({ permissions = {}, onChange }) {
  return (
    <SectionCard title="Custom permissions" subtitle="Enable fine-grained access.">
      <div className="space-y-4">
        {Object.entries(permissions).map(([key, val]) => (
          <ToggleSwitch key={key} label={key} checked={!!val} onChange={(e) => onChange?.({ ...permissions, [key]: e.target.checked })} />
        ))}
      </div>
    </SectionCard>
  );
}

export function AccessLevelIndicator({ level = 'Member' }) {
  const variant = level.toLowerCase().includes('admin') ? 'warning' : 'info';
  return <Badge variant={variant}>{level}</Badge>;
}

export function ResourceLockIcon({ locked }) {
  return (
    <span className={locked ? 'text-gray-600' : 'text-gray-300'} title={locked ? 'Locked' : 'Unlocked'} aria-label={locked ? 'Locked' : 'Unlocked'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </span>
  );
}
