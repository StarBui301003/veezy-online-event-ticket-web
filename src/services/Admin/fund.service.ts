/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from '@/services/axios.customize';

import type { WithdrawalRequestDto, PaginatedResponseDto, ApiResponse } from '@/types/Admin/fund';
import type { AxiosResponse } from 'axios';

// Lấy danh sách chờ duyệt
export async function getPendingWithdrawals(params: any): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    return instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/pending-withdrawals-details', { params });
}

// Lấy danh sách đang xử lý
export async function getProcessingWithdrawals(params: any): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    return instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/processing-withdrawals-details', { params });
}

// Lấy danh sách đã xác nhận thanh toán
export async function getSuccessfulWithdrawals(params: any): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    return instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/successful-withdrawals-details', { params });
}

// Lấy tất cả yêu cầu rút tiền (bao gồm bị từ chối)
export async function getAllWithdrawalRequests(params: any): Promise<AxiosResponse<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>> {
    return instance.get<ApiResponse<PaginatedResponseDto<WithdrawalRequestDto>>>('/api/Fund/all-withdrawal-requests-details', { params });
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

// Cho phép rút tiền cho sự kiện
export async function enableWithdrawal(eventId: string) {
    return instance.post(`/api/Fund/event/${eventId}/enable-withdrawal`);
}

// Tắt rút tiền cho sự kiện
export async function disableWithdrawal(eventId: string) {
    return instance.post(`/api/Fund/event/${eventId}/disable-withdrawal`);
}
