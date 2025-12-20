import ClientLayout from '../../components/layouts/ClientLayout';
import NotificationPreferences from '../../components/notifications/NotificationPreferences';

export default function NotificationPreferencesPage() {
  return (
    <ClientLayout title="Notification Preferences">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage how and when you receive notifications
          </p>
        </div>
        <NotificationPreferences />
      </div>
    </ClientLayout>
  );
}
