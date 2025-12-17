import Textarea from '../ui/Textarea';

export default function FormTextarea({
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
  rows = 4,
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
    <Textarea
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={touched && error ? error : null}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={className}
      {...props}
    />
  );
}

