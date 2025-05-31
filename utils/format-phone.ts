/**
 * Formats a phone number to a standardized format
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone

  // If the phone number already has a plus sign, assume it's already in international format
  if (phone.startsWith("+")) {
    return phone
  }

  // Remove all non-numeric characters
  const digitsOnly = phone.replace(/\D/g, "")

  // If the number doesn't start with a country code, add +420 (Czech Republic) by default
  let formattedPhone = digitsOnly

  if (!digitsOnly.startsWith("420") && !digitsOnly.startsWith("42")) {
    // If it starts with 0, replace that 0 with 420
    if (digitsOnly.startsWith("0")) {
      formattedPhone = `420${digitsOnly.slice(1)}`
    } else {
      formattedPhone = `420${digitsOnly}`
    }
  }

  // Ensure it starts with +
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = `+${formattedPhone}`
  }

  return formattedPhone
}

export const formatPhone = formatPhoneNumber
