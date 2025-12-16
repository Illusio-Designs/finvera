import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import Input from '../../ui/Input';
import Tabs from '../../ui/Tabs';
import ToggleSwitch from '../../ui/ToggleSwitch';
import SectionCard from '../_shared/SectionCard';

export function SettingsNavigationTabs({ tabs = [], active, onChange }) {
  return <Tabs tabs={tabs} active={active} onChange={onChange} />;
}

export function EmailPreferencesPanel({ prefs = {}, onChange }) {
  return (
    <SectionCard title="Email preferences">
      <div className="space-y-4">
        <ToggleSwitch
          label="Product updates"
          checked={!!prefs.productUpdates}
          onChange={(e) => onChange?.({ ...prefs, productUpdates: e.target.checked })}
        />
        <ToggleSwitch
          label="Security alerts"
          checked={!!prefs.securityAlerts}
          onChange={(e) => onChange?.({ ...prefs, securityAlerts: e.target.checked })}
        />
      </div>
    </SectionCard>
  );
}

export function NotificationSettingsPushEmailSMS({ settings = {}, onChange }) {
  return (
    <SectionCard title="Notification settings" subtitle="Choose how we notify you.">
      <div className="space-y-4">
        <ToggleSwitch label="Email" checked={!!settings.email} onChange={(e) => onChange?.({ ...settings, email: e.target.checked })} />
        <ToggleSwitch label="Push" checked={!!settings.push} onChange={(e) => onChange?.({ ...settings, push: e.target.checked })} />
        <ToggleSwitch label="SMS" checked={!!settings.sms} onChange={(e) => onChange?.({ ...settings, sms: e.target.checked })} />
      </div>
    </SectionCard>
  );
}

export function PrivacySettingsPanel({ settings = {}, onChange }) {
  return (
    <SectionCard title="Privacy">
      <div className="space-y-4">
        <ToggleSwitch label="Make profile public" checked={!!settings.publicProfile} onChange={(e) => onChange?.({ ...settings, publicProfile: e.target.checked })} />
        <ToggleSwitch label="Show activity status" checked={!!settings.activityStatus} onChange={(e) => onChange?.({ ...settings, activityStatus: e.target.checked })} />
      </div>
    </SectionCard>
  );
}

export function ConnectedAppsIntegrationsList({ apps = [] }) {
  return (
    <SectionCard title="Connected apps">
      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{a.name}</div>
              <div className="text-xs text-gray-500">{a.description}</div>
            </div>
            {a.action}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function APIKeysManagement({ keys = [], onCreate, onRevoke }) {
  return (
    <SectionCard title="API keys" subtitle="Create and revoke keys for integrations.">
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button onClick={onCreate}>Create key</Button>
        </div>
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{k.label || k.id}</div>
              <div className="text-xs text-gray-500">Last used: {k.lastUsed || '—'}</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => onRevoke?.(k)}>Revoke</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function WebhooksConfiguration({ webhooks = [], onAdd }) {
  return (
    <SectionCard title="Webhooks" subtitle="Send events to your system.">
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button onClick={onAdd}>Add webhook</Button>
        </div>
        {webhooks.map((w) => (
          <div key={w.id} className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">{w.url}</div>
            <div className="text-xs text-gray-500 mt-1">Events: {w.events?.join(', ') || '—'}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function DataExportButton({ onExport, loading }) {
  return (
    <Button onClick={onExport} loading={loading} variant="outline">
      Export data
    </Button>
  );
}

export function AccountDeletionModal({ isOpen, onClose, onDelete }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onDelete}
      title="Delete account"
      message="This action is permanent. Your data will be deleted."
      confirmText="Delete"
      variant="danger"
    />
  );
}

export function SettingsNavigationExample() {
  const [active, setActive] = useState('profile');
  return (
    <Card>
      <SettingsNavigationTabs
        tabs={[{ value: 'profile', label: 'Profile' }, { value: 'security', label: 'Security' }]}
        active={active}
        onChange={setActive}
      />
      <div className="p-4 text-sm text-gray-600">Active: {active}</div>
    </Card>
  );
}
