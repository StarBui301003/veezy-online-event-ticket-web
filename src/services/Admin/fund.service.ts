/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from '@/services/axios.customize';

import type { WithdrawalRequestDto, PaginatedResponseDto, ApiResponse } from '@/types/Admin/fund';
import type { AxiosResponse } from 'axios';
import qs from 'qs';

// Updated filter interface for fund withdrawals to match backend WithdrawalFilterDto
export interface FundFilterParams {
    // Pagination parameters
    Page?: number;
    PageSize?: number;

    // Search and filter parameters
    SearchTerm?: string;
    MinAmount?: number;
    MaxAmount?: number;
    TransactionStatus?: string; // Pending, Processing, Paid, Rejected
    SortBy?: string;
    SortDescending?: boolean;
}

// Lấy danh sách chờ duyệt
export async function getPendingWithdrawals(params: FundFilterParams): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    console.log('🚀 API Call - getPendingWithdrawals:', params);
    const res = await instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/pending-withdrawals-details', {
        params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    console.log('📥 API Response - getPendingWithdrawals:', res.data);
    return res;
}

// Lấy danh sách đang xử lý
export async function getProcessingWithdrawals(params: FundFilterParams): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    console.log('🚀 API Call - getProcessingWithdrawals:', params);
    const res = await instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/processing-withdrawals-details', {
        params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    console.log('📥 API Response - getProcessingWithdrawals:', res.data);
    return res;
}

// Lấy danh sách đã xác nhận thanh toán
export async function getSuccessfulWithdrawals(params: FundFilterParams): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    console.log('🚀 API Call - getSuccessfulWithdrawals:', params);
    const res = await instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/successful-withdrawals-details', {
        params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    console.log('📥 API Response - getSuccessfulWithdrawals:', res.data);
    return res;
}

export async function getRejectedWithdrawals(params: FundFilterParams): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    console.log('🚀 API Call - getRejectedWithdrawals:', params);
    const res = await instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/rejected-withdrawals-details', {
        params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    console.log('📥 API Response - getRejectedWithdrawals:', res.data);
    return res;
}

// Lấy tất cả yêu cầu rút tiền (bao gồm bị từ chối)
export async function getAllWithdrawalRequests(params: FundFilterParams): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    console.log('🚀 API Call - getAllWithdrawalRequests:', params);
    const res = await instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/all-withdrawal-requests-details', {
        params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    console.log('📥 API Response - getAllWithdrawalRequests:', res.data);
    return res;
}

// Duyệt yêu cầu rút tiền
export async function approveWithdrawal(transactionId: string, payload: { Notes: string }) {
    return instance.post(`/api/Fund/withdrawal/${transactionId}/approve`, payload);
}

// Xác nhận đã thanh toán
export async function confirmPayment(transactionId: string, payload: { Notes: string }) {
    return instance.post(`/api/Fund/withdrawal/${transactionId}/confirm-payment`, payload);
}

// Từ chối yêu cầu rút tiền
export async function rejectWithdrawal(transactionId: string, payload: { Reason: string }) {
    return instance.post(`/api/Fund/withdrawal/${transactionId}/reject`, payload);
}

