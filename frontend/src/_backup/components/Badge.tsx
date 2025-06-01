import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  animated = true,
  onClick,
}: BadgeProps) => {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    outline: 'border border-input bg-background',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`inline-flex items-center justify-center font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses}`}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={animated ? { type: 'spring', duration: 0.5 } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}; 