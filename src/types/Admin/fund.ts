export interface WithdrawalRequestDto {
    transactionId: string;
    eventId: string;
    eventName: string;
    bankAccount: string;
    bankAccountName: string;
    bankName: string;
    amount: number;
    transactionDescription: string;
    transactionStatus: string | number; // Có thể là string hoặc number tuỳ API
    createdAt: string;
    processedAt?: string;
    initiatedByAccountId: string;
    initiatedByName: string;
    processedByName?: string;
    notes?: string;
}

export interface PaginatedResponseDto<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export enum TransactionStatus {
    Success = 0,
    Failed = 1,
    Pending = 2,
    Processing = 3,
    Paid = 4,
    Rejected = 5,
    Other = 6,
}

export const TRANSACTION_STATUS_LABEL: Record<string | number, string> = {
    0: 'Success',
    1: 'Failed',
    2: 'Pending',
    3: 'Processing',
    4: 'Paid',
    5: 'Rejected',
    6: 'Other',
    Success: 'Success',
    Failed: 'Failed',
    Pending: 'Pending',
    Processing: 'Processing',
    Paid: 'Paid',
    Rejected: 'Rejected',
    Other: 'Other',
};

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
