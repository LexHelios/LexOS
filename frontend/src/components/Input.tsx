import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-background border-input',
      filled: 'bg-muted border-transparent',
      outline: 'bg-transparent border-input',
    };

    return (
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <motion.div
          className={`relative flex items-center rounded-md border ${
            variantClasses[variant]
          } ${
            error
              ? 'border-destructive focus-within:ring-destructive'
              : 'focus-within:ring-ring'
          } focus-within:ring-2 focus-within:ring-offset-2`}
          whileFocus={{ scale: 1.01 }}
        >
          {leftIcon && (
            <span className="ml-3 h-4 w-4 text-muted-foreground">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`h-10 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground ${
              leftIcon ? 'pl-2' : ''
            } ${rightIcon ? 'pr-2' : ''}`}
            {...props}
          />
          {rightIcon && (
            <span className="mr-3 h-4 w-4 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </motion.div>
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
    );
  }
);

Input.displayName = 'Input'; 