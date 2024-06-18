import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sanitizeString = (str: string) => {
  return str.replace(/[^\x20-\x7E]/g, (char) => {
    return '';
  });
};



