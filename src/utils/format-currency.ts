
/**
 * Formats a number as a currency string
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'es-MX')
 * @returns The formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  currency = 'USD', 
  locale = 'es-MX'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
