/**
 * BIKAN Loading Skeleton Components
 * ──────────────────────────────────
 * Reusable skeleton loaders for perceived performance
 */

'use client';

import React from 'react';

export const SkeletonLine: React.FC<{ width?: string; height?: string }> = ({ 
  width = '100%', 
  height = '1rem' 
}) => (
  <div className="skeleton" style={{ width, height }} />
);

export const SkeletonCard: React.FC = () => (
  <div className="soft-ui-card p-6 space-y-3">
    <SkeletonLine width="60%" height="1.25rem" />
    <SkeletonLine width="100%" />
    <SkeletonLine width="80%" />
  </div>
);

export const SkeletonPlayer: React.FC = () => (
  <div className="aspect-video rounded-2xl skeleton" />
);

export const SkeletonAssessment: React.FC = () => (
  <div className="space-y-4">
    <SkeletonLine width="40%" height="1.5rem" />
    <div className="soft-ui-card p-8">
      <SkeletonLine width="90%" height="1.25rem" />
      <div className="mt-2">
        <SkeletonLine width="70%" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="soft-ui-card p-5"><SkeletonLine width="60%" /></div>
      <div className="soft-ui-card p-5"><SkeletonLine width="50%" /></div>
      <div className="soft-ui-card p-5"><SkeletonLine width="70%" /></div>
      <div className="soft-ui-card p-5"><SkeletonLine width="55%" /></div>
    </div>
  </div>
);
