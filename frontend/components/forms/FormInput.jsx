import Input from '../ui/Input';

export default function FormInput({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
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
      type={type}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={touched && error ? error : null}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}

