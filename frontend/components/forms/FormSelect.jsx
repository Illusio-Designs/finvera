import Select from '../ui/Select';

export default function FormSelect({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options = [],
  placeholder = 'Select an option',
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
    <Select
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={touched && error ? error : null}
      options={options}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}

