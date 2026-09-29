/**
 * Indian Currency Formatter & Financial Utilities
 * Standardized across Maintenance, Water, Expenses, Reimbursements & Reports.
 */

/**
 * Formats a numeric value or string amount into Indian currency format (e.g. ₹3,000, ₹25,500, ₹1,25,000).
 */
export function formatCurrency(amount: number | string | null | undefined, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Parses a currency string back to a numeric amount.
 */
export function parseCurrency(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates sum of an array of numbers or objects with a numeric property.
 */
export function calculateSum<T>(items: T[], key?: keyof T): number {
  return items.reduce((acc, item) => {
    if (key && typeof item === 'object' && item !== null) {
      const val = Number((item as Record<string, unknown>)[key as string]) || 0;
      return acc + val;
    }
    return acc + (Number(item) || 0);
  }, 0);
}

/**
 * Calculates percentage safely without division by zero.
 */
export function calculatePercentage(part: number, total: number, decimals: number = 1): number {
  if (!total || total === 0) return 0;
  const pct = (part / total) * 100;
  return Number(pct.toFixed(decimals));
}
