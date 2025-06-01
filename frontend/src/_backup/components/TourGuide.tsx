import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from 'usehooks-ts';

interface Step {
  id: string;
  title: string;
  content: string;
  target: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
}

interface TourGuideProps {
  steps: Step[];
  onComplete?: () => void;
}

export const TourGuide = ({ steps, onComplete }: TourGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('has-seen-tour', false);

  useEffect(() => {
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, [hasSeenTour]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      setHasSeenTour(true);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setHasSeenTour(true);
    onComplete?.();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const targetElement = document.querySelector(currentStepData.target);

  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();
  const position = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black"
          onClick={handleSkip}
        />

        {/* Highlight */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="absolute rounded-lg border-2 border-primary"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
          }}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute z-50 w-80 rounded-lg bg-background p-4 shadow-xl"
          style={{
            top: position.top + position.height + 16,
            left: position.left,
          }}
        >
          <h3 className="mb-2 text-lg font-semibold">{currentStepData.title}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{currentStepData.content}</p>
          <div className="flex justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleNext}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 