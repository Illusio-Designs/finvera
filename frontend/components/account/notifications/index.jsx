import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Badge from '../../ui/Badge';
import { ToastViewport, notify } from '../../ui/Toast';
import SectionCard from '../_shared/SectionCard';

export function ToastSnackbarNotifications() {
  return <ToastViewport />;
}

export function NotificationCenterPanel({ children }) {
  return (
    <Card className="shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="text-lg font-semibold text-gray-900">Notifications</div>
        <Badge variant="info">In-app</Badge>
      </div>
      <div className="px-6 py-4">{children}</div>
    </Card>
  );
}

export function NotificationItemCard({ title, message, time, unread, onClick, right }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full text-left rounded-lg border p-4 transition-colors " +
        (unread ? 'border-primary-200 bg-primary-50 hover:bg-primary-100' : 'border-gray-200 bg-white hover:bg-gray-50')
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600 mt-1">{message}</div>
          {time ? <div className="text-xs text-gray-500 mt-2">{time}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </button>
  );
}

export function MarkAsReadButton({ onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      Mark as read
    </Button>
  );
}

export function NotificationPreferencesToggle({ label, checked, onChange }) {
  return <ToggleSwitch label={label} checked={checked} onChange={onChange} />;
}

export function InAppNotificationBadge({ count = 0 }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center text-xs font-semibold bg-red-600 text-white rounded-full h-5 min-w-5 px-1">
      {count}
    </span>
  );
}

export function demoNotifySuccess() {
  notify.success('Saved successfully');
}

export function demoNotifyError() {
  notify.error('Something went wrong');
}
