import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-[#A65A3A] text-white'
                    : isActive
                    ? 'bg-[#0F172A] text-white ring-4 ring-[#0F172A]/15'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
              </div>
              <div>
                <p className={`text-xs font-extrabold tracking-tight ${isActive ? 'text-[#0F172A]' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-gray-450 font-bold mt-0.5 tracking-tight">{step.description}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="hidden sm:block flex-1 h-0.5 bg-gray-200 mx-4" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
