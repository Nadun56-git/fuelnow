/**
 * Loader Component
 * Loading states and skeleton screens
 */

import React from 'react';
import { Fuel } from 'lucide-react';

/**
 * Full-screen loader with animated fuel icon
 */
export const FullScreenLoader = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Fuel className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>
    </div>
    <p className="mt-6 text-slate-400 text-lg">{message}</p>
  </div>
);

/**
 * Inline loader for buttons and small areas
 */
export const InlineLoader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-amber-500/30 border-t-amber-500 rounded-full animate-spin ${className}`}
    />
  );
};

/**
 * Skeleton card for station list
 */
export const StationCardSkeleton = () => (
  <div className="bg-slate-800 rounded-xl p-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-slate-700 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-700 rounded w-full mb-3" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-700 rounded-full w-16" />
          <div className="h-6 bg-slate-700 rounded-full w-16" />
          <div className="h-6 bg-slate-700 rounded-full w-16" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton list for multiple station cards
 */
export const StationListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <StationCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Map skeleton loader
 */
export const MapSkeleton = () => (
  <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center">
    <div className="text-center">
      <Fuel className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <p className="text-slate-600">Loading map...</p>
    </div>
  </div>
);

/**
 * Text skeleton
 */
export const TextSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-slate-700 rounded animate-pulse"
        style={{ width: `${100 - (i % 3) * 20}%` }}
      />
    ))}
  </div>
);

export default {
  FullScreenLoader,
  InlineLoader,
  StationCardSkeleton,
  StationListSkeleton,
  MapSkeleton,
  TextSkeleton
};
