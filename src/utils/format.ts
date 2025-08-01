// Format utilities for discount codes and pricing

/**
 * Format value based on discount type
 * @param value - The numeric value
 * @param discountType - 0 for percentage, 1 for fixed amount, 2 for other
 * @returns Formatted string
 */
export const formatDiscountValue = (value: number, discountType: number): string => {
    if (discountType === 0) {
        // Percentage
        return `${value}%`;
    } else if (discountType === 1) {
        // Fixed amount in VND
        return formatCurrency(value);
    } else if (discountType === 2) {
        // Other type - display as is
        return value.toString();
    } else {
        // Unknown type
        return value.toString();
    }
};

/**
 * Format currency in Vietnamese Dong
 * @param amount - Amount in VND
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format minimum and maximum amounts (always in VND)
 * @param amount - Amount in VND
 * @returns Formatted currency string or "N/A" if 0
 */
export const formatMinMaxAmount = (amount: number): string => {
    if (amount === 0 || amount === null || amount === undefined) {
        return 'N/A';
    }
    return formatCurrency(amount);
};

/**
 * Get discount type label
 * @param discountType - Discount type number
 * @returns Human readable label
 */
export const getDiscountTypeLabel = (discountType: number): string => {
    switch (discountType) {
        case 0:
            return 'Percentage';
        case 1:
            return 'Amount';
        case 2:
            return 'Other';
        default:
            return 'Unknown';
    }
}; 