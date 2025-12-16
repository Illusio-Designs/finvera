import Button from '../../ui/Button';
import ErrorBoundary from '../../ui/ErrorBoundary';
import Card from '../../ui/Card';

export function ErrorBoundaryFallback({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export function Page404({ title = 'Page not found', message = 'The page you’re looking for doesn’t exist.', onBack }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full shadow-sm">
        <div className="text-2xl font-semibold text-gray-900">{title}</div>
        <div className="mt-2 text-gray-600">{message}</div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onBack}>Go back</Button>
          <Button onClick={() => (window.location.href = '/')}>Home</Button>
        </div>
      </Card>
    </div>
  );
}

export function Page500({ title = 'Server error', message = 'Something went wrong on our side.', onRetry }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full shadow-sm">
        <div className="text-2xl font-semibold text-gray-900">{title}</div>
        <div className="mt-2 text-gray-600">{message}</div>
        <div className="mt-6">
          <Button onClick={onRetry}>Retry</Button>
        </div>
      </Card>
    </div>
  );
}

export function NetworkErrorBanner({ message = 'Network error. Please check your connection.', onRetry }) {
  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between gap-4">
      <div className="text-sm text-yellow-800">{message}</div>
      {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}

export function RetryActionButton(props) {
  return <Button {...props}>Retry</Button>;
}

export function OfflineModeIndicator({ offline }) {
  if (!offline) return null;
  return (
    <div className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Offline
    </div>
  );
}
