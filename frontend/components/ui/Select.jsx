import CustomSelect from './CustomSelect';

// Re-export CustomSelect as Select for backward compatibility
// This ensures all existing Select components use the new custom dropdown design
export default function Select(props) {
  return <CustomSelect {...props} />;
}

