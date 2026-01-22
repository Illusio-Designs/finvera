import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-400',
    IconComponent: FiAlertCircle
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-400',
    IconComponent: FiAlertTriangle
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-400',
    IconComponent: FiCheckCircle
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-400',
    IconComponent: FiInfo
  }
};

export const Alert = ({ variant = 'info', className = '', children, ...props }) => {
  const styles = variantStyles[variant] || variantStyles.info;
  const { IconComponent } = styles;

  return (
    <div
      className={`border rounded-lg p-4 ${styles.container} ${className}`}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AlertDescription = ({ className = '', children, ...props }) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertTitle = ({ className = '', children, ...props }) => {
  return (
    <h3 className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </h3>
  );
};

export default Alert;