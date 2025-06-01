import { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outline';
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      variant = 'default',
      className = '',
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
      options.find(opt => opt.value === value) || null
    );
    const selectRef = useRef<HTMLDivElement>(null);

    const variantClasses = {
      default: 'bg-background border-input',
      filled: 'bg-muted border-transparent',
      outline: 'bg-transparent border-input',
    };

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;
      setSelectedOption(option);
      onChange?.(option.value);
      setIsOpen(false);
    };

    return (
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div ref={selectRef}>
          <motion.div
            className={`relative flex items-center rounded-md border ${
              variantClasses[variant]
            } ${
              error
                ? 'border-destructive focus-within:ring-destructive'
                : 'focus-within:ring-ring'
            } focus-within:ring-2 focus-within:ring-offset-2`}
            whileFocus={{ scale: 1.01 }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {leftIcon && (
              <span className="ml-3 h-4 w-4 text-muted-foreground">
                {leftIcon}
              </span>
            )}
            <div
              className={`h-10 w-full cursor-pointer bg-transparent px-3 text-sm outline-none ${
                leftIcon ? 'pl-2' : ''
              } ${rightIcon ? 'pr-2' : ''}`}
            >
              {selectedOption?.label || 'Select an option'}
            </div>
            {rightIcon && (
              <span className="mr-3 h-4 w-4 text-muted-foreground">
                {rightIcon}
              </span>
            )}
            <motion.span
              className="mr-3 h-4 w-4 text-muted-foreground"
              animate={{ rotate: isOpen ? 180 : 0 }}
            >
              ▼
            </motion.span>
          </motion.div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-1 w-full rounded-md bg-popover shadow-lg"
              >
                <div className="max-h-60 overflow-auto py-1">
                  {options.map(option => (
                    <motion.div
                      key={option.value}
                      className={`cursor-pointer px-3 py-2 text-sm ${
                        option.disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-muted'
                      } ${
                        option.value === selectedOption?.value
                          ? 'bg-muted'
                          : ''
                      }`}
                      onClick={() => handleSelect(option)}
                      whileHover={option.disabled ? undefined : { x: 4 }}
                    >
                      {option.label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

Select.displayName = 'Select'; 