import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'outline';
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-background border-input',
      filled: 'bg-muted border-transparent',
      outline: 'bg-transparent border-input',
    };

    return (
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <input
              ref={ref}
              type="radio"
              className={`peer h-4 w-4 cursor-pointer appearance-none rounded-full border ${
                variantClasses[variant]
              } ${
                error
                  ? 'border-destructive focus:ring-destructive'
                  : 'focus:ring-ring'
              } focus:ring-2 focus:ring-offset-2`}
              {...props}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                scale: props.checked ? 1 : 0,
                opacity: props.checked ? 1 : 0,
              }}
              transition={{ type: 'spring', duration: 0.2 }}
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: props.checked ? 1 : 0 }}
                transition={{ type: 'spring', duration: 0.2 }}
              />
            </motion.div>
          </motion.div>
        </div>
        {label && (
          <div className="ml-2">
            <label
              className={`text-sm font-medium ${
                error ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {label}
            </label>
            {error && (
              <motion.p
                className="mt-1 text-xs text-destructive"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

// Example usage:
export const RadioGroup = ({
  children,
  label,
  error,
}: {
  children: React.ReactNode;
  label?: string;
  error?: string;
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="space-y-2">{children}</div>
      {error && (
        <motion.p
          className="text-xs text-destructive"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}; 