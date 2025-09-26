import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shortenAddress = (address?: string): string => {
  if (!address) {
    return '';
  }
  const length = address.length;

  return `${address.substring(0, 4)}...${address.substring(length - 4, length)}`;
};
