import { useState } from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  onClick?: () => void;
}

export const Avatar = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  status,
  onClick,
}: AvatarProps) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <div className="relative inline-block">
      <Component
        className={`relative overflow-hidden rounded-full ${sizeClasses[size]} ${
          onClick ? 'cursor-pointer' : ''
        }`}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        {src && !error ? (
          <motion.img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onError={() => setError(true)}
          />
        ) : (
          <motion.div
            className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {fallback ? getInitials(fallback) : '?'}
          </motion.div>
        )}
      </Component>

      {status && (
        <motion.div
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
            statusColors[status]
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        />
      )}
    </div>
  );
}; 