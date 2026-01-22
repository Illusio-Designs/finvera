/**
 * SaaS Account Management - Component Library List
 *
 * Each entry maps your requested component name -> real export + path.
 * - **path**: file or folder you import from
 * - **export**: named export (or 'default')
 * - **status**: 'existing' | 'new'
 */

export const componentLibraryList = [
  {
    category: '1. Authentication Components',
    items: [
      { name: 'Login Form', path: 'components/account/auth', export: 'LoginForm', status: 'new' },
      { name: 'Registration/Signup Form', path: 'components/account/auth', export: 'RegistrationSignupForm', status: 'new' },
      { name: 'Password Reset Form', path: 'components/account/auth', export: 'PasswordResetForm', status: 'new' },
      { name: 'Two-Factor Authentication (2FA) Setup', path: 'components/account/auth', export: 'TwoFactorSetup', status: 'new' },
      { name: '2FA Verification Input', path: 'components/account/auth', export: 'TwoFactorVerificationInput', status: 'new' },
      { name: 'Social Login Buttons (Google, GitHub, etc.)', path: 'components/account/auth', export: 'SocialLoginButtons', status: 'new' },
      { name: 'Magic Link Login', path: 'components/account/auth', export: 'MagicLinkLogin', status: 'new' },
      { name: 'Session Expired Modal', path: 'components/account/auth', export: 'SessionExpiredModal', status: 'new' },
      { name: 'Remember Me Checkbox', path: 'components/account/auth', export: 'RememberMeCheckbox', status: 'new' },
    ],
  },
  {
    category: '2. Dashboard Components',
    items: [
      { name: 'Dashboard Layout/Container', path: 'components/account/dashboard', export: 'DashboardLayoutContainer', status: 'new' },
      { name: 'Sidebar Navigation', path: 'components/layouts/Sidebar.jsx', export: 'default', status: 'existing' },
      { name: 'Top Navigation Bar', path: 'components/layouts/Header.jsx', export: 'default', status: 'existing' },
      { name: 'Breadcrumb Navigation', path: 'components/ui/Breadcrumbs.jsx', export: 'default', status: 'existing' },
      { name: 'Quick Stats Cards', path: 'components/account/dashboard', export: 'QuickStatsCards', status: 'new' },
      { name: 'Activity Feed/Timeline', path: 'components/account/dashboard', export: 'ActivityFeedTimeline', status: 'new' },
      { name: 'Notification Bell with Dropdown', path: 'components/account/dashboard', export: 'NotificationBellWithDropdown', status: 'new' },
      { name: 'User Avatar with Dropdown Menu', path: 'components/account/dashboard', export: 'UserAvatarWithDropdownMenu', status: 'new' },
      { name: 'Search Bar (Global)', path: 'components/account/dashboard', export: 'SearchBarGlobal', status: 'new' },
      { name: 'Welcome Banner', path: 'components/account/dashboard', export: 'WelcomeBanner', status: 'new' },
    ],
  },
  {
    category: '3. User Profile Components',
    items: [
      { name: 'Profile Header', path: 'components/account/profile', export: 'ProfileHeader', status: 'new' },
      { name: 'Profile Picture Upload/Editor', path: 'components/account/profile', export: 'ProfilePictureUploadEditor', status: 'new' },
      { name: 'Personal Information Form', path: 'components/account/profile', export: 'PersonalInformationForm', status: 'new' },
      { name: 'Contact Details Form', path: 'components/account/profile', export: 'ContactDetailsForm', status: 'new' },
      { name: 'Bio/Description Editor', path: 'components/account/profile', export: 'BioDescriptionEditor', status: 'new' },
      { name: 'Social Media Links Section', path: 'components/account/profile', export: 'SocialMediaLinksSection', status: 'new' },
      { name: 'Language/Timezone Selector', path: 'components/account/profile', export: 'LanguageTimezoneSelector', status: 'new' },
      { name: 'Profile Completion Indicator', path: 'components/account/profile', export: 'ProfileCompletionIndicator', status: 'new' },
      { name: 'Public Profile Preview', path: 'components/account/profile', export: 'PublicProfilePreview', status: 'new' },
    ],
  },
  {
    category: '4. Account Settings Components',
    items: [
      { name: 'Settings Navigation Tabs', path: 'components/account/settings', export: 'SettingsNavigationTabs', status: 'new' },
      { name: 'Email Preferences Panel', path: 'components/account/settings', export: 'EmailPreferencesPanel', status: 'new' },
      { name: 'Notification Settings (Push, Email, SMS)', path: 'components/account/settings', export: 'NotificationSettingsPushEmailSMS', status: 'new' },
      { name: 'Privacy Settings Panel', path: 'components/account/settings', export: 'PrivacySettingsPanel', status: 'new' },
      { name: 'Connected Apps/Integrations List', path: 'components/account/settings', export: 'ConnectedAppsIntegrationsList', status: 'new' },
      { name: 'API Keys Management', path: 'components/account/settings', export: 'APIKeysManagement', status: 'new' },
      { name: 'Webhooks Configuration', path: 'components/account/settings', export: 'WebhooksConfiguration', status: 'new' },
      { name: 'Data Export Button', path: 'components/account/settings', export: 'DataExportButton', status: 'new' },
      { name: 'Account Deletion Modal', path: 'components/account/settings', export: 'AccountDeletionModal', status: 'new' },
    ],
  },
  {
    category: '5. Security Components',
    items: [
      { name: 'Password Change Form', path: 'components/account/security', export: 'PasswordChangeForm', status: 'new' },
      { name: 'Active Sessions List', path: 'components/account/security', export: 'ActiveSessionsList', status: 'new' },
      { name: 'Login History Table', path: 'components/account/security', export: 'LoginHistoryTable', status: 'new' },
      { name: 'Security Questions Setup', path: 'components/account/security', export: 'SecurityQuestionsSetup', status: 'new' },
      { name: 'Backup Codes Display', path: 'components/account/security', export: 'BackupCodesDisplay', status: 'new' },
      { name: 'Device Management List', path: 'components/account/security', export: 'DeviceManagementList', status: 'new' },
      { name: 'Security Audit Log', path: 'components/account/security', export: 'SecurityAuditLog', status: 'new' },
      { name: 'Trusted Devices List', path: 'components/account/security', export: 'TrustedDevicesList', status: 'new' },
    ],
  },
  {
    category: '6. Billing & Subscription Components',
    items: [
      { name: 'Current Plan Card', path: 'components/account/billing', export: 'CurrentPlanCard', status: 'new' },
      { name: 'Plan Comparison Table', path: 'components/account/billing', export: 'PlanComparisonTable', status: 'new' },
      { name: 'Upgrade/Downgrade Modal', path: 'components/account/billing', export: 'UpgradeDowngradeModal', status: 'new' },
      { name: 'Payment Method Form', path: 'components/account/billing', export: 'PaymentMethodForm', status: 'new' },
      { name: 'Saved Payment Methods List', path: 'components/account/billing', export: 'SavedPaymentMethodsList', status: 'new' },
      { name: 'Billing History Table', path: 'components/account/billing', export: 'BillingHistoryTable', status: 'new' },
      { name: 'Invoice Download Links', path: 'components/account/billing', export: 'InvoiceDownloadLinks', status: 'new' },
      { name: 'Usage Meter/Progress Bar', path: 'components/account/billing', export: 'UsageMeterProgressBar', status: 'new' },
      { name: 'Billing Cycle Selector', path: 'components/account/billing', export: 'BillingCycleSelector', status: 'new' },
      { name: 'Promo Code Input', path: 'components/account/billing', export: 'PromoCodeInput', status: 'new' },
      { name: 'Tax Information Form', path: 'components/account/billing', export: 'TaxInformationForm', status: 'new' },
      { name: 'Cancel Subscription Modal', path: 'components/account/billing', export: 'CancelSubscriptionModal', status: 'new' },
      { name: 'Reactivate Subscription Button', path: 'components/account/billing', export: 'ReactivateSubscriptionButton', status: 'new' },
    ],
  },
  {
    category: '7. Team/Organization Components',
    items: [
      { name: 'Team Members List/Table', path: 'components/account/team', export: 'TeamMembersListTable', status: 'new' },
      { name: 'Invite Member Modal', path: 'components/account/team', export: 'InviteMemberModal', status: 'new' },
      { name: 'Role & Permissions Selector', path: 'components/account/team', export: 'RolePermissionsSelector', status: 'new' },
      { name: 'Pending Invitations List', path: 'components/account/team', export: 'PendingInvitationsList', status: 'new' },
      { name: 'Team Member Card', path: 'components/account/team', export: 'TeamMemberCard', status: 'new' },
      { name: 'Remove Member Confirmation', path: 'components/account/team', export: 'RemoveMemberConfirmation', status: 'new' },
      { name: 'Transfer Ownership Modal', path: 'components/account/team', export: 'TransferOwnershipModal', status: 'new' },
      { name: 'Organization Settings Form', path: 'components/account/team', export: 'OrganizationSettingsForm', status: 'new' },
      { name: 'Department/Group Manager', path: 'components/account/team', export: 'DepartmentGroupManager', status: 'new' },
    ],
  },
  {
    category: '8. Notification Components',
    items: [
      { name: 'Toast/Snackbar Notifications', path: 'components/account/notifications', export: 'ToastSnackbarNotifications', status: 'new' },
      { name: 'Notification Center Panel', path: 'components/account/notifications', export: 'NotificationCenterPanel', status: 'new' },
      { name: 'Notification Item Card', path: 'components/account/notifications', export: 'NotificationItemCard', status: 'new' },
      { name: 'Mark as Read Button', path: 'components/account/notifications', export: 'MarkAsReadButton', status: 'new' },
      { name: 'Notification Preferences Toggle', path: 'components/account/notifications', export: 'NotificationPreferencesToggle', status: 'new' },
      { name: 'In-App Notification Badge', path: 'components/account/notifications', export: 'InAppNotificationBadge', status: 'new' },
    ],
  },
  {
    category: '9. Form Components',
    items: [
      { name: 'Text Input Field', path: 'components/ui/Input.jsx', export: 'default', status: 'existing' },
      { name: 'Email Input Field', path: 'components/account/forms', export: 'EmailInputField', status: 'new' },
      { name: 'Password Input with Show/Hide', path: 'components/ui/PasswordInput.jsx', export: 'default', status: 'new' },
      { name: 'Textarea', path: 'components/ui/Textarea.jsx', export: 'default', status: 'existing' },
      { name: 'Dropdown/Select Menu', path: 'components/ui/Select.jsx', export: 'default', status: 'existing' },
      { name: 'Multi-Select Dropdown', path: 'components/account/forms', export: 'MultiSelectDropdown', status: 'new' },
      { name: 'Checkbox', path: 'components/ui/Checkbox.jsx', export: 'default', status: 'new' },
      { name: 'Radio Button Group', path: 'components/ui/RadioGroup.jsx', export: 'default', status: 'new' },
      { name: 'Toggle Switch', path: 'components/ui/ToggleSwitch.jsx', export: 'default', status: 'new' },
      { name: 'Date Picker', path: 'components/account/forms', export: 'DatePicker', status: 'new' },
      { name: 'Time Picker', path: 'components/account/forms', export: 'TimePicker', status: 'new' },
      { name: 'File Upload/Dropzone', path: 'components/account/forms', export: 'FileUploadDropzone', status: 'new' },
      { name: 'Form Validation Messages', path: 'components/account/forms', export: 'FormValidationMessages', status: 'new' },
      { name: 'Required Field Indicator', path: 'components/account/forms', export: 'RequiredFieldIndicator', status: 'new' },
    ],
  },
  {
    category: '10. Data Display Components',
    items: [
      { name: 'Data Table with Sorting', path: 'components/tables/DataTable.jsx', export: 'default', status: 'existing' },
      { name: 'Pagination Controls', path: 'components/tables/Pagination.jsx', export: 'default', status: 'existing' },
      { name: 'Empty State Placeholder', path: 'components/ui/EmptyState.jsx', export: 'default', status: 'existing' },
      { name: 'Progress Bar', path: 'components/ui/ProgressBar.jsx', export: 'default', status: 'new' },
      { name: 'Status Badge/Chip', path: 'components/ui/Badge.jsx', export: 'default', status: 'existing' },
      { name: 'Avatar with Initials Fallback', path: 'components/ui/Avatar.jsx', export: 'default', status: 'new' },
      { name: 'Tooltip', path: 'components/ui/Tooltip.jsx', export: 'default', status: 'new' },
      { name: 'Info Popover', path: 'components/ui/Popover.jsx', export: 'default', status: 'new' },
      { name: 'Accordion/Collapsible Section', path: 'components/ui/Accordion.jsx', export: 'default', status: 'new' },
    ],
  },
  {
    category: '11. Modal/Dialog Components',
    items: [
      { name: 'Confirmation Dialog', path: 'components/ui/ConfirmDialog.jsx', export: 'default', status: 'existing' },
      { name: 'Alert/Warning Modal', path: 'components/account/modals', export: 'AlertWarningModal', status: 'new' },
      { name: 'Full-Screen Modal', path: 'components/account/modals', export: 'FullScreenModal', status: 'new' },
      { name: 'Drawer/Slide-out Panel', path: 'components/account/modals', export: 'DrawerSlideOutPanel', status: 'new' },
      { name: 'Bottom Sheet (Mobile)', path: 'components/account/modals', export: 'BottomSheetMobile', status: 'new' },
      { name: 'Dialog Backdrop/Overlay', path: 'components/account/modals', export: 'DialogBackdropOverlay', status: 'new' },
    ],
  },
  {
    category: '12. Action Components',
    items: [
      { name: 'Primary Action Button', path: 'components/ui/Button.jsx', export: 'default', status: 'existing' },
      { name: 'Secondary Action Button', path: 'components/account/actions', export: 'SecondaryActionButton', status: 'new' },
      { name: 'Danger/Delete Button', path: 'components/account/actions', export: 'DangerDeleteButton', status: 'new' },
      { name: 'Icon Button', path: 'components/ui/IconButton.jsx', export: 'default', status: 'new' },
      { name: 'Button with Loading State', path: 'components/ui/Button.jsx', export: 'default', status: 'existing' },
      { name: 'Dropdown Menu Button', path: 'components/account/actions', export: 'DropdownMenuButton', status: 'new' },
      { name: 'Split Button', path: 'components/account/actions', export: 'SplitButton', status: 'new' },
      { name: 'Floating Action Button', path: 'components/account/actions', export: 'FloatingActionButton', status: 'new' },
      { name: 'Copy to Clipboard Button', path: 'components/account/actions', export: 'CopyToClipboardButton', status: 'new' },
    ],
  },
  {
    category: '13. Onboarding Components',
    items: [
      { name: 'Welcome Screen', path: 'components/account/onboarding', export: 'WelcomeScreen', status: 'new' },
      { name: 'Feature Tour/Walkthrough', path: 'components/account/onboarding', export: 'FeatureTourWalkthrough', status: 'new' },
      { name: 'Step Progress Indicator', path: 'components/account/onboarding', export: 'StepProgressIndicator', status: 'new' },
      { name: 'Onboarding Checklist', path: 'components/account/onboarding', export: 'OnboardingChecklist', status: 'new' },
      { name: 'Tutorial Tooltips', path: 'components/account/onboarding', export: 'TutorialTooltips', status: 'new' },
      { name: 'Quick Start Guide Card', path: 'components/account/onboarding', export: 'QuickStartGuideCard', status: 'new' },
      { name: 'Skip/Next Buttons', path: 'components/account/onboarding', export: 'SkipNextButtons', status: 'new' },
    ],
  },
  {
    category: '14. Access Control Components',
    items: [
      { name: 'Permission Matrix Table', path: 'components/account/access', export: 'PermissionMatrixTable', status: 'new' },
      { name: 'Role Creation Form', path: 'components/account/access', export: 'RoleCreationForm', status: 'new' },
      { name: 'Custom Permission Builder', path: 'components/account/access', export: 'CustomPermissionBuilder', status: 'new' },
      { name: 'Access Level Indicator', path: 'components/account/access', export: 'AccessLevelIndicator', status: 'new' },
      { name: 'Resource Lock Icon', path: 'components/account/access', export: 'ResourceLockIcon', status: 'new' },
    ],
  },
  {
    category: '15. Support Components',
    items: [
      { name: 'Help Widget/Chat Button', path: 'components/account/support', export: 'HelpWidgetChatButton', status: 'new' },
      { name: 'FAQ Accordion', path: 'components/ui/Accordion.jsx', export: 'default', status: 'new' },
      { name: 'Contact Support Form', path: 'components/account/support', export: 'ContactSupportForm', status: 'new' },
      { name: 'Ticket History List', path: 'components/account/support', export: 'TicketHistoryList', status: 'new' },
      { name: 'Knowledge Base Search', path: 'components/account/support', export: 'KnowledgeBaseSearch', status: 'new' },
      { name: 'Feature Request Form', path: 'components/account/support', export: 'FeatureRequestForm', status: 'new' },
    ],
  },
  {
    category: '16. Analytics Components (Account Level)',
    items: [
      { name: 'Usage Statistics Cards', path: 'components/account/analytics', export: 'UsageStatisticsCards', status: 'new' },
      { name: 'Activity Graph/Chart', path: 'components/account/analytics', export: 'ActivityGraphChart', status: 'new' },
      { name: 'Time-based Filter', path: 'components/account/analytics', export: 'TimeBasedFilter', status: 'new' },
      { name: 'Export Data Button', path: 'components/account/analytics', export: 'ExportDataButton', status: 'new' },
      { name: 'Comparison Date Selector', path: 'components/account/analytics', export: 'ComparisonDateSelector', status: 'new' },
    ],
  },
  {
    category: '17. Mobile-Specific Components',
    items: [
      { name: 'Mobile Menu (Hamburger)', path: 'components/account/mobile', export: 'MobileMenuHamburger', status: 'new' },
      { name: 'Bottom Navigation Bar', path: 'components/account/mobile', export: 'BottomNavigationBar', status: 'new' },
      { name: 'Swipe Actions', path: 'components/account/mobile', export: 'SwipeActions', status: 'new' },
      { name: 'Pull-to-Refresh', path: 'components/account/mobile', export: 'PullToRefresh', status: 'new' },
      { name: 'Mobile-Optimized Forms', path: 'components/account/mobile', export: 'MobileOptimizedForms', status: 'new' },
    ],
  },
  {
    category: '18. Feedback Components',
    items: [
      { name: 'Rating Stars', path: 'components/account/feedback', export: 'RatingStars', status: 'new' },
      { name: 'Feedback Form', path: 'components/account/feedback', export: 'FeedbackForm', status: 'new' },
      { name: 'Feature Vote Button', path: 'components/account/feedback', export: 'FeatureVoteButton', status: 'new' },
      { name: 'Survey/Poll Card', path: 'components/account/feedback', export: 'SurveyPollCard', status: 'new' },
      { name: 'Success Confirmation Screen', path: 'components/account/feedback', export: 'SuccessConfirmationScreen', status: 'new' },
    ],
  },
  {
    category: '19. Error Handling Components',
    items: [
      { name: 'Error Boundary Fallback', path: 'components/ui/ErrorBoundary.jsx', export: 'default', status: 'existing' },
      { name: '404 Page', path: 'components/account/errors', export: 'Page404', status: 'new' },
      { name: '500 Error Page', path: 'components/account/errors', export: 'Page500', status: 'new' },
      { name: 'Network Error Banner', path: 'components/account/errors', export: 'NetworkErrorBanner', status: 'new' },
      { name: 'Retry Action Button', path: 'components/account/errors', export: 'RetryActionButton', status: 'new' },
      { name: 'Offline Mode Indicator', path: 'components/account/errors', export: 'OfflineModeIndicator', status: 'new' },
    ],
  },
  {
    category: '20. Accessibility Components',
    items: [
      { name: 'Skip to Content Link', path: 'components/account/a11y', export: 'SkipToContentLink', status: 'new' },
      { name: 'Screen Reader Text', path: 'components/account/a11y', export: 'ScreenReaderText', status: 'new' },
      { name: 'Keyboard Navigation Indicators', path: 'components/account/a11y', export: 'KeyboardNavigationIndicators', status: 'new' },
      { name: 'Focus Trap Modal', path: 'components/account/a11y', export: 'FocusTrapModal', status: 'new' },
      { name: 'ARIA Live Region Announcements', path: 'components/account/a11y', export: 'AriaLiveRegionAnnouncements', status: 'new' },
    ],
  },
];

export default componentLibraryList;
