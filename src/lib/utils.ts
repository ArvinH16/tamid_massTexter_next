import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number to ensure it has a country code
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number with country code
 */
export function formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let formatted = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming US numbers)
    if (formatted.length === 10) {
        formatted = '1' + formatted; // Add US country code
    }
    
    // Make sure it starts with +
    if (!formatted.startsWith('+')) {
        formatted = '+' + formatted;
    }
    
    return formatted;
}
