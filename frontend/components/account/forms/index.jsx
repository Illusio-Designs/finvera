import { useMemo, useState } from 'react';
import {
  Checkbox,
  IconButton,
  Input,
  PasswordInput,
  Popover,
  RadioGroup,
  Select,
  Textarea,
  ToggleSwitch,
} from '../../ui';

export function RequiredFieldIndicator({ className = '' }) {
  return <span className={`text-red-500 ${className}`} aria-hidden="true">*</span>;
}

export function FormValidationMessages({ errors = [], className = '' }) {
  const list = Array.isArray(errors) ? errors.filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-3 ${className}`} role="alert">
      <div className="text-sm font-semibold text-red-700">Please fix the following:</div>
      <ul className="mt-2 list-disc pl-5 text-sm text-red-700 space-y-1">
        {list.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function TextInputField(props) {
  return <Input {...props} type={props.type || 'text'} />;
}

export function EmailInputField(props) {
  return <Input {...props} type="email" />;
}

export function PasswordInputWithShowHide(props) {
  return <PasswordInput {...props} />;
}

export function TextareaField(props) {
  return <Textarea {...props} />;
}

export function DropdownSelectMenu(props) {
  return <Select {...props} />;
}

export function MultiSelectDropdown({
  label,
  name,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  className = '',
}) {
  const selected = useMemo(() => new Set(value || []), [value]);

  const triggerLabel = value?.length
    ? `${value.length} selected`
    : placeholder;

  return (
    <div className={`w-full ${className}`}>
      {label ? <div className="block text-sm font-medium text-gray-700 mb-1">{label}</div> : null}
      <Popover
        trigger={
          <button
            type="button"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {triggerLabel}
          </button>
        }
      >
        <div className="max-h-56 overflow-auto space-y-2">
          {options.map((opt) => (
            <Checkbox
              key={opt.value}
              name={`${name}.${opt.value}`}
              label={opt.label}
              checked={selected.has(opt.value)}
              onChange={() => {
                const next = new Set(selected);
                if (next.has(opt.value)) next.delete(opt.value);
                else next.add(opt.value);
                onChange?.({ target: { name, value: Array.from(next) } });
              }}
            />
          ))}
        </div>
      </Popover>
    </div>
  );
}

export function CheckboxField(props) {
  return <Checkbox {...props} />;
}

export function RadioButtonGroup(props) {
  return <RadioGroup {...props} />;
}

export function ToggleSwitchField(props) {
  return <ToggleSwitch {...props} />;
}

export function DatePicker({ label, name, value, onChange, error, required, disabled, className = '' }) {
  return (
    <Input
      label={label}
      name={name}
      type="date"
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
}

export function TimePicker({ label, name, value, onChange, error, required, disabled, className = '' }) {
  return (
    <Input
      label={label}
      name={name}
      type="time"
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
}

export function FileUploadDropzone({
  label,
  name,
  accept,
  onChange,
  helpText,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      {label ? <div className="block text-sm font-medium text-gray-700 mb-1">{label}</div> : null}
      <label className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
        <input
          type="file"
          name={name}
          accept={accept}
          className="sr-only"
          onChange={onChange}
        />
        <div className="text-sm font-semibold text-gray-800">Drop a file here or click to upload</div>
        {helpText ? <div className="text-xs text-gray-500">{helpText}</div> : null}
      </label>
    </div>
  );
}

export function CopyToClipboardButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      label={copied ? 'Copied' : 'Copy to clipboard'}
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
      {copied ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      )}
    </IconButton>
  );
}
