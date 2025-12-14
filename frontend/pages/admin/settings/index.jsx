import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import toast from 'react-hot-toast';
import { FiSave, FiMail, FiLock, FiBell, FiGlobe, FiDatabase } from 'react-icons/fi';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [generalSettings, setGeneralSettings] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
  });

  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    password_min_length: 8,
    require_2fa: false,
    max_login_attempts: 5,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    target_reminders: true,
    commission_alerts: true,
    payout_alerts: true,
    tenant_alerts: true,
  });

  const handleSave = async (section) => {
    setLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'database', label: 'Database', icon: FiDatabase },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Settings">
        <PageLayout
          title="System Settings"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Settings' },
          ]}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-1 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="inline h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  <FormInput
                    label="Company Name"
                    value={generalSettings.company_name}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, company_name: e.target.value })}
                  />
                  <FormInput
                    label="Company Email"
                    type="email"
                    value={generalSettings.company_email}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, company_email: e.target.value })}
                  />
                  <FormInput
                    label="Company Phone"
                    value={generalSettings.company_phone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, company_phone: e.target.value })}
                  />
                  <FormInput
                    label="Company Address"
                    type="textarea"
                    value={generalSettings.company_address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, company_address: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Timezone"
                      type="select"
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                    </FormInput>
                    <FormInput
                      label="Currency"
                      type="select"
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </FormInput>
                  </div>
                  <Button onClick={() => handleSave('General')} disabled={loading}>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save General Settings
                  </Button>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Settings</h3>
                  <FormInput
                    label="SMTP Host"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                  />
                  <FormInput
                    label="SMTP Port"
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                  />
                  <FormInput
                    label="SMTP Username"
                    value={emailSettings.smtp_user}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                  />
                  <FormInput
                    label="SMTP Password"
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                  />
                  <FormInput
                    label="From Email"
                    type="email"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                  />
                  <FormInput
                    label="From Name"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                  />
                  <Button onClick={() => handleSave('Email')} disabled={loading}>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  <FormInput
                    label="Session Timeout (minutes)"
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: parseInt(e.target.value) })}
                  />
                  <FormInput
                    label="Minimum Password Length"
                    type="number"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, password_min_length: parseInt(e.target.value) })}
                  />
                  <FormInput
                    label="Max Login Attempts"
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, max_login_attempts: parseInt(e.target.value) })}
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="require_2fa"
                      checked={securitySettings.require_2fa}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, require_2fa: e.target.checked })}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <label htmlFor="require_2fa" className="ml-2 text-sm text-gray-700">
                      Require Two-Factor Authentication
                    </label>
                  </div>
                  <Button onClick={() => handleSave('Security')} disabled={loading}>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-3">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => handleSave('Notifications')} disabled={loading}>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              )}

              {activeTab === 'database' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Management</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      Database operations should be performed with caution. Always backup your data before making changes.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button variant="outline" onClick={() => toast.info('Backup functionality coming soon')}>
                      Create Backup
                    </Button>
                    <Button variant="outline" onClick={() => toast.info('Restore functionality coming soon')}>
                      Restore from Backup
                    </Button>
                    <Button variant="outline" onClick={() => toast.info('Optimize functionality coming soon')}>
                      Optimize Database
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
