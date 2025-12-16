import { useState } from 'react';
import Button from '../../ui/Button';
import IconButton from '../../ui/IconButton';
import DropdownMenu from '../../ui/DropdownMenu';

export function PrimaryActionButton(props) {
  return <Button {...props} variant={props.variant || 'primary'} />;
}

export function SecondaryActionButton(props) {
  return <Button {...props} variant={props.variant || 'outline'} />;
}

export function DangerDeleteButton(props) {
  return <Button {...props} variant={props.variant || 'danger'} />;
}

export function IconButtonComponent(props) {
  return <IconButton {...props} />;
}

export function ButtonWithLoadingState(props) {
  return <Button {...props} loading={!!props.loading} />;
}

export function DropdownMenuButton({ label = 'Actions', items = [] }) {
  return (
    <DropdownMenu
      trigger={<Button variant="outline">{label}</Button>}
      items={items}
    />
  );
}

export function SplitButton({ label = 'Action', items = [], onPrimary }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-300">
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50"
        onClick={onPrimary}
      >
        {label}
      </button>
      <DropdownMenu
        trigger={<button type="button" className="px-2 py-2 bg-white hover:bg-gray-50 border-l border-gray-300" aria-label="More">▾</button>}
        items={items}
        align="end"
      />
    </div>
  );
}

export function FloatingActionButton({ onClick, label = 'Create', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
      aria-label={label}
      title={label}
    >
      {children || <span className="text-2xl leading-none">+</span>}
    </button>
  );
}

export function CopyToClipboardButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text || '');
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // ignore
        }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}
