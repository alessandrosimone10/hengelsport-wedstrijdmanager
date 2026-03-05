import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Voegt className strings samen en merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bestaande functies voor gewichtsberekening (blijven behouden)
export function getTotalWeight(participant: any): number {
  return participant.catches.reduce((sum: number, c: any) => sum + c.weight, 0);
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}