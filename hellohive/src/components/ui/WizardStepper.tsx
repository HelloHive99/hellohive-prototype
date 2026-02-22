import { Check } from 'lucide-react';

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  maxReachedStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ steps, currentStep, maxReachedStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isClickable = stepNum <= maxReachedStep && onStepClick;

        return (
          <div key={stepNum} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              className={`flex items-center gap-3 ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              {/* Step circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                isCurrent ? 'bg-[#F5C518] text-black' :
                isCompleted ? 'bg-green-600 text-white' :
                'bg-gray-700 text-gray-400'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>

              {/* Step label */}
              <span className={`text-sm font-medium hidden md:block ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                {step}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 md:mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
