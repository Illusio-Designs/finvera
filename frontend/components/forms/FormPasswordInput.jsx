import PasswordInput from '../ui/PasswordInput';

export default function FormPasswordInput({
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
    <PasswordInput
      label={label}
      name={name}
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
