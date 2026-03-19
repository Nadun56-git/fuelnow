/**
 * FuelBadge Component
 * Color-coded availability badge for individual fuel types
 */

import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';

export const FuelBadge = ({ 
  available, 
  label, 
  lastUpdated,
  showLastUpdated = false,
  size = 'md',
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Determine styles based on availability
  const getStyles = () => {
    if (available === true) {
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        icon: Check,
        label: 'Available'
      };
    }
    if (available === false) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: X,
        label: 'Unavailable'
      };
    }
    return {
      bg: 'bg-gray-400',
      text: 'text-white',
      icon: HelpCircle,
      label: 'Unknown'
    };
  };

  const styles = getStyles();
  const Icon = styles.icon;

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMins = Math.floor((now - then) / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span 
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizeClasses[size]}
          ${styles.bg} ${styles.text}
        `}
      >
        <Icon className={iconSizes[size]} />
        {label || styles.label}
      </span>
      
      {showLastUpdated && lastUpdated && (
        <span className="text-xs text-slate-500">
          {formatTimeAgo(lastUpdated)}
        </span>
      )}
    </div>
  );
};

/**
 * Compact fuel status dots for station cards
 */
export const FuelStatusDots = ({ fuel, className = '' }) => {
  const fuelTypes = [
    { key: 'superDiesel', label: 'SD', color: 'bg-purple-500' },
    { key: 'diesel', label: 'D', color: 'bg-blue-500' },
    { key: 'superPetrol', label: 'SP', color: 'bg-amber-500' },
    { key: 'petrol', label: 'P', color: 'bg-green-500' }
  ];

  const getDotColor = (status) => {
    if (status === true) return 'bg-green-500';
    if (status === false) return 'bg-red-500';
    return 'bg-gray-300';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {fuelTypes.map(({ key, label }) => {
        const status = fuel?.[key]?.available;
        return (
          <div
            key={key}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${getDotColor(status)} text-white
            `}
            title={`${label}: ${status === true ? 'Available' : status === false ? 'Unavailable' : 'Unknown'}`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Overall station status badge
 */
export const StationStatusBadge = ({ fuel, className = '' }) => {
  const getStatus = () => {
    if (!fuel) return { label: 'Unknown', color: 'bg-gray-400' };
    
    const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
    const statuses = types.map(type => fuel[type]?.available);
    
    const available = statuses.filter(s => s === true).length;
    const unavailable = statuses.filter(s => s === false).length;
    const unknown = statuses.filter(s => s === null || s === undefined).length;
    
    if (unknown === 4) return { label: 'No Updates', color: 'bg-gray-400' };
    if (available === 0 && unavailable > 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (available > 0 && unavailable === 0) return { label: 'In Stock', color: 'bg-green-500' };
    return { label: 'Mixed', color: 'bg-amber-500' };
  };

  const status = getStatus();

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
      ${status.color} ${className}
    `}>
      {status.label}
    </span>
  );
};

export default FuelBadge;
