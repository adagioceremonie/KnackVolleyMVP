import React from 'react';

interface KnackLogoProps {
  variant?: 'full' | 'compact' | 'badge' | 'hero' | 'crest';
  className?: string;
  theme?: 'dark' | 'light';
  size?: number;
}

export const KnackCrest: React.FC<{
  className?: string;
  size?: number;
  alt?: string;
}> = () => null;

export const KnackLogo: React.FC<KnackLogoProps> = () => null;
