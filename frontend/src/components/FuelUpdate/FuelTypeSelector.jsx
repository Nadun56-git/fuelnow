/**
 * FuelTypeSelector Component
 * Toggle selector for individual fuel type availability
 */

import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';

const FuelTypeSelector = ({
  label,
  selected,
  onChange,
  isOptional = false,
  className = ''
}) => {
  // Options configuration
  const options = [
    { value: true, label: 'Available', icon: Check, color: 'green' },
    { value: false, label: 'Not Available', icon: X, color: 'red' },
    { value: null, label: 'Unknown', icon: HelpCircle, color: 'gray' }
  ];

  const getButtonStyles = (value) => {
    const isSelected = selected === value;
    
    const baseStyles = 'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all';
    
    if (!isSelected) {
      return `${baseStyles} bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200`;
    }
    
    switch (value) {
      case true:
        return `${baseStyles} bg-green-500 text-white shadow-lg shadow-green-500/30`;
      case false:
        return `${baseStyles} bg-red-500 text-white shadow-lg shadow-red-500/30`;
      default:
        return `${baseStyles} bg-gray-500 text-white`;
    }
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white">{label}</span>
        {isOptional && (
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
            Optional
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {options.map(({ value, label: optionLabel, icon: Icon }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => onChange(value)}
            className={getButtonStyles(value)}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{optionLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Compact fuel type selector for mobile
 */
export const CompactFuelTypeSelector = ({
  label,
  selected,
  onChange,
  className = ''
}) => {
  const options = [
    { value: true, color: 'bg-green-500', label: '✓' },
    { value: false, color: 'bg-red-500', label: '✗' },
    { value: null, color: 'bg-gray-400', label: '?' }
  ];

  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex gap-1">
        {options.map(({ value, color, label: btnLabel }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => onChange(value)}
            className={`
              w-8 h-8 rounded-full font-bold text-sm transition-all
              ${selected === value 
                ? `${color} text-white scale-110` 
                : 'bg-slate-700 text-slate-500 hover:bg-slate-600'}
            `}
          >
            {btnLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FuelTypeSelector;
