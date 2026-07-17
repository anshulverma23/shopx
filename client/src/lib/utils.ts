import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shorten a Mongo ObjectId into a readable, uppercase order/reference number. */
export function shortId(id: string | undefined | null): string {
  if (!id) return "------";
  return id.slice(-8).toUpperCase();
}
