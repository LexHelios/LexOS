import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-background text-foreground hover:bg-muted',
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-muted',
      ghost: 'hover:bg-muted',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

    return (
      <motion.button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          variantClasses[variant]
        } ${sizeClasses[size]} ${roundedClasses} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <motion.div
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 h-4 w-4">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2 h-4 w-4">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button'; 