
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
  width = 30, // Default width
  height = 30, // Default height
}) => {
  return (
    <Image
      src="/images/panaguas-logo.png" // Path relative to the public directory
      alt="PanAguas Logo"
      width={width} // Use passed or default width
      height={height} // Use passed or default height
      className={cn(className)} // Apply external classes; size is primarily controlled by width/height props
      priority // Load the logo image early
    />
  );
};

export { PanAguasLogo };
