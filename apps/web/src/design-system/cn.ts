import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário canônico de mesclagem de classes CSS para o ALEGON AI Photo Studio.
 * Garante que classes condicionais do Tailwind sejam combinadas sem conflitos.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
