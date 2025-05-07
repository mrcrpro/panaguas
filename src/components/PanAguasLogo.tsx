
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PanAguasLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const PanAguasLogo: FC<PanAguasLogoProps> = ({
  className,
  width = 30,
  height = 30,
}) => {
  return (
    <Image
      src="/images/panaguas-logo.png" // Path relative to the public directory
      alt="PanAguas Logo"
      width={width}
      height={height}
      className={cn('h-7 w-7', className)} // Default size, can be overridden
      priority // Load the logo image early
    />
  );
};

export { PanAguasLogo };
