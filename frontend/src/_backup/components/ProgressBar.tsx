import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animated?: boolean;
}

export const ProgressBar = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  animated = true,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const valueColorClasses = {
    default: 'text-foreground',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className="w-full">
      <div
        className={`relative w-full overflow-hidden rounded-full bg-muted ${sizeClasses[size]}`}
      >
        <motion.div
          className={`${variantClasses[variant]} ${sizeClasses[size]}`}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : {}}
        />
      </div>
      {showValue && (
        <div className="mt-1 flex justify-between text-xs">
          <span className={valueColorClasses[variant]}>
            {Math.round(percentage)}%
          </span>
          <span className="text-muted-foreground">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
}; 