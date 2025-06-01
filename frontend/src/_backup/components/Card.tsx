import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Card = ({
  children,
  title,
  description,
  footer,
  variant = 'default',
  hoverable = false,
  onClick,
  className = '',
}: CardProps) => {
  const variantClasses = {
    default: 'bg-card',
    bordered: 'bg-card border border-border',
    elevated: 'bg-card shadow-lg',
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`overflow-hidden rounded-lg ${variantClasses[variant]} ${
        hoverable ? 'transition-shadow hover:shadow-md' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={hoverable ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {(title || description) && (
        <div className="border-b border-border p-4">
          {title && (
            <h3 className="text-lg font-semibold text-card-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="p-4">{children}</div>

      {footer && (
        <div className="border-t border-border bg-muted/50 p-4">
          {footer}
        </div>
      )}
    </Component>
  );
};

// Example usage:
export const CardGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
};

export const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="border-b border-border p-4">{children}</div>;
};

export const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4">{children}</div>;
};

export const CardFooter = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="border-t border-border bg-muted/50 p-4">{children}</div>
  );
}; 