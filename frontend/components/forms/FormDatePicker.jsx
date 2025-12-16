import Input from '../ui/Input';

export default function FormDatePicker({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(name, e.target.value);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name);
    }
  };

  return (
    <Input
      label={label}
      name={name}
      type="date"
      value={value || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      error={touched && error ? error : null}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      className={className}
      {...props}
    />
  );
}

