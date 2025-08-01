// === Get Approved Events (public) ===
export async function getApprovedEvents(page = 1, pageSize = 100) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  return instance.get(`/api/Event/approved`, {
    params: { page, pageSize }
  });
}
import instance from "@/services/axios.customize";
import { CreateEventData, NewsPayload, CreateTicketData, News } from "@/types/event";
import type { AIRecommendResponse } from '@/types/ai-recommend-event';

// === Event APIs ===

export async function createEvent(data: CreateEventData) {
  const response = await instance.post(
    "/api/Event",
    data
  );
  return response.data || null;
}

// category
export async function getAllCategories() {
  try {
    const response = await instance.get("/api/Category");
    const categories = response.data.data;
    if (!Array.isArray(categories)) {
      throw new Error(
        "Expected an array of categories but got: " + JSON.stringify(categories)
      );
    }
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories", error);
    throw error;
  }
}

// upload image
export async function uploadImage(file: File): Promise<string> {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await instance.post(
      "/api/Event/upload-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Image upload failed", error);
    throw error;
  }
}

// === Get Event by ID ===
export async function getEventById(eventId: string) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const response = await instance.get(`/api/Event/${eventId}`);
  return response.data?.data || response.data;
}

// === Get My Events ===
export async function getMyEvents(page = 1, pageSize = 100) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const response = await instance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`
  );
  return response.data?.data || response.data;
}

// === Get My Approved Events ===
export async function getMyApprovedEvents(page = 1, pageSize = 100) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const response = await instance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`
  );
  const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
  return items.filter(event => event.isApproved === 1 && !event.isCancelled);
}

// === Cancel Event ===
export async function cancelEvent(eventId: string) {
  const response = await instance.post(
    `/api/Event/${eventId}/cancel`,
    {}
  );
  return response.data?.data || response.data;
}

// === Update Event ===
export async function updateEvent(eventId: string, data: CreateEventData) {
  const response = await instance.put(
    `/api/Event/${eventId}`,
    data
  );
  return response.data?.data || response.data;
}


// === Delete Event Image ===
export async function deleteEventImage(imageUrl: string) {
  return instance.delete(
    `/api/Event/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`
  );
}

// === Get My Events With Status & Search ===
export async function getMyEventsWithStatus(filter: string, searchTerm: string) {
  const response = await instance.get(
    `/api/Event?filter=${filter}&searchTerm=${searchTerm}`
  );
  return Array.isArray(response.data?.data) ? response.data.data :
    Array.isArray(response.data) ? response.data : [];
}

// === Get All Events (public) ===
export async function getAllEvents(page = 1, pageSize = 12) {
  try {
    const response = await instance.get("/api/Event", {
      params: { page, pageSize }
    });
    let items = response.data?.data?.items ?? [];
    if (!Array.isArray(items)) items = [];
    return items;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return [];
  }
}

// === Resend Approval Request ===
export async function resendApprovalRequest(eventId: string) {
  const response = await instance.post(
    `/api/Event/${eventId}/resend-approval`,
    {}
  );
  return response.data?.data || response.data;
}

// === Get My Pending Events ===
export async function getMyPendingEvents(page = 1, pageSize = 100) {
  const response = await instance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`
  );
  const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
  return items.filter(event => event.isApproved === 0 && !event.isCancelled);
}

// === Ticket APIs ===

export async function createTicket(data: CreateTicketData) {
  const response = await instance.post(
    "/api/Ticket",
    data
  );
  return response.data?.data || response.data;
}

// Lấy danh sách vé của 1 event
export async function getTicketsByEvent(eventId: string) {
  const response = await instance.get(
    `/api/Ticket/event/${eventId}`
  );
  return Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
}

// Tìm kiếm vé theo từ khóa
export async function searchTickets(keyword: string) {
  const response = await instance.get(
    `/api/Ticket/search?keyword=${encodeURIComponent(keyword)}`
  );
  return response.data?.data || response.data;
}

// Cập nhật vé
export async function updateTicket(id: string, data: Partial<CreateTicketData>) {
  const response = await instance.put(
    `/api/Ticket/${id}`,
    data
  );
  return response.data?.data || response.data;
}

// Xóa vé
export async function deleteTicket(id: string) {
  const response = await instance.delete(
    `/api/Ticket/${id}`
  );
  return response.data?.data || response.data;
}

// Đổi trạng thái vé
export async function updateTicketStatus(id: string, status: string) {
  const response = await instance.put(
    `/api/Ticket/${id}/status`,
    { status }
  );
  return response.data?.data || response.data;
}

// === News APIs ===

export const createNews = async (data: NewsPayload) => {
  try {
    console.log('createNews API call - URL:', '/api/News');
    console.log('createNews API call - Data:', JSON.stringify(data, null, 2));
    console.log('createNews API call - Headers:', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('access_token')
    });

    const response = await instance.post('/api/News', data);
    console.log('Create news API response:', response);
    return response;
  } catch (error) {
    console.error('Create news API error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = error as { response?: { status?: number; data?: unknown; headers?: Record<string, string> } };
      console.error('Error response details:', {
        status: errorResponse.response?.status,
        data: errorResponse.response?.data,
        headers: errorResponse.response?.headers
      });

      if (errorResponse.response?.data) {
        console.error('Full error response data:', JSON.stringify(errorResponse.response.data, null, 2));
      }
    }
    throw error;
  }
};

export const getAllNews = (page: number = 1, pageSize: number = 10) => instance.get<{
  flag: boolean;
  code: number;
  data: {
    items: News[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}>(`/api/News/all?Page=${page}&PageSize=${pageSize}`);

export const getNewsByEvent = (eventId: string) => instance.get<{
  flag: boolean;
  code: number;
  data: {
    items: News[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}>(`/api/News/byEvent?eventId=${eventId}`);

export const deleteNews = (newsId: string) => instance.delete(`/api/News/${newsId}`);

export const uploadNewsImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await instance.post("/api/News/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const getNewsDetail = (newsId: string) => instance.get(`/api/News/${newsId}`);

export const getMyNews = (page: number = 1, pageSize: number = 10) => instance.get<{
  flag: boolean;
  code: number;
  data: {
    items: News[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}>(`/api/News/my-news?Page=${page}&PageSize=${pageSize}`);

export const getAllNewsHome = (page: number = 1, pageSize: number = 10) => instance.get<{
  flag: boolean;
  code: number;
  data: {
    items: News[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}>(`/api/News/all-Home?Page=${page}&PageSize=${pageSize}`);

// === Order APIs ===

interface OrderItemPayload {
  ticketId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  orderAmount: number;
  eventId: string;
  customerId: string; // Assuming you get customerId from auth context or similar
  items: OrderItemPayload[];
  discountCode?: string;
}

interface OrderResponseItem {
  ticketId: string;
  ticketName: string;
  pricePerTicket: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  eventId: string;
  items: OrderResponseItem[];
  discountCode: string | null;
  holdUntil: string;
  totalAmount: number;
  orderStatus: number; // You might want to create an enum for this
  paidAt: string | null;
  createdAt: string;
}

export interface OrderApiResponse {
  success: boolean;
  message: string;
  data: {
    items: Order[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | Order; // POST /api/Order returns a single Order object in data
}


export async function getOrders(pageNumber: number = 1, pageSize: number = 10): Promise<OrderApiResponse> {
  try {
    const response = await instance.get("/api/Order", {
      params: { PageNumber: pageNumber, PageSize: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch orders", error);
    throw error; // Or return a default error structure
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    // Calculate the base order amount from items (before discount)
    const baseOrderAmount = payload.items.reduce((sum, item) => {
      const price = (item as any).pricePerTicket || (item as any).ticketPrice || (item as any).price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    // Ensure we have a valid order amount
    if (baseOrderAmount <= 0) {
      throw new Error('Tổng tiền đơn hàng phải lớn hơn 0');
    }

    // Create the final payload with the correct orderAmount (before discount)
    const finalPayload = {
      ...payload,
      orderAmount: baseOrderAmount // Always use the calculated base amount (before discount)
    };

    console.log('Creating order with payload:', finalPayload); // Debug log

    const response = await instance.post("/api/Order", finalPayload);
    
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Failed to create order", error);
    throw error;
  }
}

/**
 * Create order with face authentication (multipart/form-data)
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.customerId
 * @param {Array<{ticketId: string, quantity: number}>} params.items
 * @param {File} params.faceImage
 * @param {number[]} [params.faceEmbedding]
 * @param {string} [params.discountCode]
 * @returns {Promise<OrderApiResponse>} API response
 */
export async function createOrderWithFace({ eventId, customerId, items, faceImage, faceEmbedding, discountCode }: {
  eventId: string;
  customerId: string;
  items: { ticketId: string; quantity: number }[];
  faceImage: File;
  faceEmbedding?: number[];
  discountCode?: string;
}): Promise<OrderApiResponse> {
  const formData = new FormData();
  formData.append('EventId', eventId);
  formData.append('CustomerId', customerId);
  
  // Fix: Send each item separately instead of JSON.stringify
  items.forEach((item, index) => {
    formData.append(`Items[${index}].ticketId`, item.ticketId);
    formData.append(`Items[${index}].quantity`, item.quantity.toString());
  });
  
  formData.append('FaceImage', faceImage);
  
  if (faceEmbedding && Array.isArray(faceEmbedding)) {
    faceEmbedding.forEach((num, index) => {
      formData.append(`FaceEmbedding[${index}]`, String(num));
    });
  }
  
  if (discountCode) {
    formData.append('DiscountCode', discountCode);
  }
  
  const response = await instance.post('/api/Order/createOrderWithFace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
// === Payment APIs ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createVnPayPayment(orderId: string): Promise<any> { // Replace 'any' with a more specific type if you know the response structure
  try {
    const response = await instance.post(`/api/Payment/VnPay?orderId=${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to create VnPay payment", error);
    throw error;
  }
}

export async function deleteOrder(orderId: string) {
  const response = await instance.delete(`/api/Order/${orderId}`);
  return response.data;
}

export async function getDiscountCodesByEvent(eventId: string) {
  const response = await instance.get(`/api/DiscountCode/event/${eventId}`);
  return response.data?.data || response.data;
}

export async function useDiscountCode(eventId: string, code: string) {
  const response = await instance.post('/api/DiscountCode/use', { eventId, code });
  return response.data;
}



// Cập nhật tin tức
export async function updateNews(newsId: string, data: Partial<NewsPayload>) {
  const response = await instance.put(`/api/News/${newsId}`, data);
  return response.data?.data || response.data;
}

// Validate discount code
export async function validateDiscountCode(eventId: string, code: string, orderAmount: number) {
  const response = await instance.post('/api/DiscountCode/validate', {
    eventId,
    code,
    orderAmount,
  });
  return response.data;
}

export async function getOrderById(orderId: string) {
  const response = await instance.get(`/api/Order/${orderId}`);
  return response.data?.data || response.data;
}

// === Collaborator APIs ===

// Create collaborator account first
export async function createCollaboratorAccount(data: {
  username: string;
  emId: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
}) {
  const response = await instance.post('/api/Account/create-collaborator', data);
  return response.data;
}

export async function getCollaboratorsForEvent(eventId: string) {
  const response = await instance.get(`/api/Event/${eventId}/collaborators`);
  // API có thể trả về data rỗng hoặc một object có data
  return response.data?.data || response.data || [];
}

// Get all collaborators available for an Event Manager
export async function getCollaboratorsByEventManager() {
  const response = await instance.get(`/api/Account/collaborators-by-eventManager`);
  // Chuẩn hóa trả về mảng items nếu có
  if (Array.isArray(response.data?.data?.items)) {
    return response.data.data.items;
  }
  if (Array.isArray(response.data?.items)) {
    return response.data.items;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function addCollaborator(eventId: string, accountId: string) {
  // Body của request là một string chứa accountId
  const response = await instance.post(`/api/Event/${eventId}/add-collaborator`, accountId, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

export async function removeCollaborator(eventId: string, collaboratorAccountId: string) {
  const response = await instance.delete(`/api/Event/${eventId}/collaborator/${collaboratorAccountId}`);
  return response.data;
}

// === Fund/Revenue APIs ===

// Tạo fund cho event
export async function createEventFund(eventId: string) {
  const response = await instance.post(`/api/Fund/event/${eventId}/create`);
  return response.data;
}

// Lấy thông tin fund của event
export async function getEventFund(eventId: string) {
  const response = await instance.get(`/api/Fund/event/${eventId}`);
  return response.data;
}

// Bật rút tiền
export async function enableWithdrawal(eventId: string) {
  const response = await instance.post(`/api/Fund/event/${eventId}/enable-withdrawal`);
  return response.data;
}

// Tắt rút tiền
export async function disableWithdrawal(eventId: string) {
  const response = await instance.post(`/api/Fund/event/${eventId}/disable-withdrawal`);
  return response.data;
}

// Lấy số dư
export async function getEventBalance(eventId: string) {
  const response = await instance.get(`/api/Fund/event/${eventId}/balance`);
  return response.data;
}

// Lấy doanh thu
export async function getEventRevenue(eventId: string) {
  const response = await instance.get(`/api/Fund/event/${eventId}/revenue`);
  return response.data;
}

// Lấy lịch sử giao dịch
export async function getEventTransactions(eventId: string) {
  const response = await instance.get(`/api/Fund/event/${eventId}/transactions`);
  return response.data;
}

// Yêu cầu rút tiền
export async function requestWithdrawal(eventId: string, amount: number) {
  const response = await instance.post(`/api/Fund/event/${eventId}/request-withdrawal`, { amount });
  return response.data;
}

// Duyệt rút tiền
export async function approveWithdrawal(transactionId: string) {
  const response = await instance.post(`/api/Fund/withdrawal/${transactionId}/approve`);
  return response.data;
}

// Xác nhận thanh toán
export async function confirmPayment(transactionId: string) {
  const response = await instance.post(`/api/Fund/withdrawal/${transactionId}/confirm-payment`);
  return response.data;
}

// Từ chối rút tiền
export async function rejectWithdrawal(transactionId: string) {
  const response = await instance.post(`/api/Fund/withdrawal/${transactionId}/reject`);
  return response.data;
}

// Lấy danh sách yêu cầu rút tiền đang chờ
export async function getPendingWithdrawals() {
  const response = await instance.get(`/api/Fund/pending-withdrawals`);
  return response.data;
}

// Lấy chi tiết yêu cầu rút tiền đang chờ
export async function getPendingWithdrawalsDetails() {
  const response = await instance.get(`/api/Fund/pending-withdrawals-details`);
  return response.data;
}

// Lấy chi tiết yêu cầu rút tiền đang xử lý
export async function getProcessingWithdrawalsDetails() {
  const response = await instance.get(`/api/Fund/processing-withdrawals-details`);
  return response.data;
}

// Lấy tất cả yêu cầu rút tiền
export async function getAllWithdrawalRequestsDetails() {
  const response = await instance.get(`/api/Fund/all-withdrawal-requests-details`);
  return response.data;
}

// Lấy tất cả fund
export async function getAllFunds() {
  const response = await instance.get(`/api/Fund/all`);
  return response.data;
}

// Cập nhật phí platform
export async function updatePlatformFee(eventId: string, fee: number) {
  const response = await instance.put(`/api/Fund/event/${eventId}/platform-fee`, { fee });
  return response.data;
}

// Bật rút tiền cho sự kiện đã hoàn thành
export async function enableWithdrawalForCompletedEvents() {
  const response = await instance.post(`/api/Fund/enable-withdrawal-for-completed-events`);
  return response.data;
}

// === Event Manager Analytics APIs ===
const ANALYTICS_PREFIX = "/api/analytics/eventManager";

type DashboardParams = {
  Period?: number;
  GroupBy?: number;
  IncludeMetrics?: string[];
  IncludeRealtimeData?: boolean;
  CustomStartDate?: string;
  CustomEndDate?: string;
  IncludeComparison?: boolean;
  ComparisonPeriod?: number;
  EventManagerId?: string;
};

type RevenueParams = {
  EventIds?: string[];
  CategoryIds?: string[];
  PaymentStatus?: number;
  Period?: number;
  GroupBy?: number;
  CustomStartDate?: string;
  CustomEndDate?: string;
  IncludeComparison?: boolean;
  ComparisonPeriod?: number;
  EventManagerId?: string;
};

type TicketStatsParams = {
  Period?: number;
  GroupBy?: number;
  CustomStartDate?: string;
  CustomEndDate?: string;
  IncludeComparison?: boolean;
  ComparisonPeriod?: number;
  EventManagerId?: string;
};

// Debug version của getEventManagerDashboard
export async function getEventManagerDashboard(params: any = {}) {
  const query = new URLSearchParams();
  
  console.log('Original params:', params);
  
  // Thử cả hai cách: camelCase và PascalCase
  if (params.period !== undefined) query.append("Period", params.period.toString());
  if (params.Period !== undefined) query.append("Period", params.Period.toString());
  
  if (params.groupBy !== undefined) query.append("GroupBy", params.groupBy.toString());
  if (params.GroupBy !== undefined) query.append("GroupBy", params.GroupBy.toString());
  
  if (params.includeRealtimeData !== undefined) query.append("IncludeRealtimeData", String(params.includeRealtimeData));
  if (params.IncludeRealtimeData !== undefined) query.append("IncludeRealtimeData", String(params.IncludeRealtimeData));
  
  if (params.customStartDate) query.append("CustomStartDate", params.customStartDate);
  if (params.CustomStartDate) query.append("CustomStartDate", params.CustomStartDate);
  
  if (params.customEndDate) query.append("CustomEndDate", params.customEndDate);
  if (params.CustomEndDate) query.append("CustomEndDate", params.CustomEndDate);
  
  if (params.includeComparison !== undefined) query.append("IncludeComparison", String(params.includeComparison));
  if (params.IncludeComparison !== undefined) query.append("IncludeComparison", String(params.IncludeComparison));
  
  if (params.comparisonPeriod !== undefined) query.append("ComparisonPeriod", params.comparisonPeriod.toString());
  if (params.ComparisonPeriod !== undefined) query.append("ComparisonPeriod", params.ComparisonPeriod.toString());
  
  if (params.eventManagerId) query.append("EventManagerId", params.eventManagerId);
  if (params.EventManagerId) query.append("EventManagerId", params.EventManagerId);

  const url = `${ANALYTICS_PREFIX}/dashboard?${query.toString()}`;
  console.log('Final API URL:', url);
  
  try {
    const response = await instance.get(url);
    console.log('API Response status:', response.status);
    console.log('API Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    throw error;
  }
}

// Thống kê doanh thu Event Manager
export async function getEventManagerRevenue(params: RevenueParams = {}) {
  const query = new URLSearchParams();
  
  if (params.EventIds) params.EventIds.forEach(id => query.append("EventIds", id));
  if (params.CategoryIds) params.CategoryIds.forEach(id => query.append("CategoryIds", id));
  if (params.PaymentStatus !== undefined) query.append("PaymentStatus", params.PaymentStatus.toString());
  if (params.Period !== undefined) query.append("Period", params.Period.toString());
  if (params.GroupBy !== undefined) query.append("GroupBy", params.GroupBy.toString());
  if (params.CustomStartDate) query.append("CustomStartDate", params.CustomStartDate);
  if (params.CustomEndDate) query.append("CustomEndDate", params.CustomEndDate);
  if (params.IncludeComparison !== undefined) query.append("IncludeComparison", String(params.IncludeComparison));
  if (params.ComparisonPeriod !== undefined) query.append("ComparisonPeriod", params.ComparisonPeriod.toString());
  if (params.EventManagerId) query.append("EventManagerId", params.EventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/revenue?${query.toString()}`);
  return response.data;
}

// Thống kê vé Event Manager
export async function getEventManagerTicketStats(params: TicketStatsParams = {}) {
  const query = new URLSearchParams();
  
  if (params.Period !== undefined) query.append("Period", params.Period.toString());
  if (params.GroupBy !== undefined) query.append("GroupBy", params.GroupBy.toString());
  if (params.CustomStartDate) query.append("CustomStartDate", params.CustomStartDate);
  if (params.CustomEndDate) query.append("CustomEndDate", params.CustomEndDate);
  if (params.IncludeComparison !== undefined) query.append("IncludeComparison", String(params.IncludeComparison));
  if (params.ComparisonPeriod !== undefined) query.append("ComparisonPeriod", params.ComparisonPeriod.toString());
  if (params.EventManagerId) query.append("EventManagerId", params.EventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/tickets/stats?${query.toString()}`);
  return response.data;
}

// Sự kiện sắp tới
export async function getUpcomingEvents(eventManagerId?: string) {
  const query = new URLSearchParams();
  if (eventManagerId) query.append("EventManagerId", eventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/events/upcoming?${query.toString()}`);
  return response.data;
}

// Tổng quan realtime
export async function getRealtimeOverview(eventManagerId?: string) {
  const query = new URLSearchParams();
  if (eventManagerId) query.append("EventManagerId", eventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/realtime/overview?${query.toString()}`);
  return response.data;
}

// So sánh hiệu suất
export async function comparePerformance(currentPeriod: number, comparisonPeriod: number, eventManagerId?: string) {
  const payload: any = {
    currentPeriod,
    comparisonPeriod
  };
  
  if (eventManagerId) {
    payload.eventManagerId = eventManagerId;
  }
  
  const response = await instance.post(`${ANALYTICS_PREFIX}/performance/compare`, payload);
  return response.data;
}

// Thêm các API bổ sung nếu cần:

// Lấy chi tiết event theo ID
export async function getEventDetails(eventId: string) {
  const response = await instance.get(`${ANALYTICS_PREFIX}/events/${eventId}/details`);
  return response.data;
}

// Thống kê theo category
export async function getCategoryStats(params: {
  Period?: number;
  GroupBy?: number;
  CustomStartDate?: string;
  CustomEndDate?: string;
  EventManagerId?: string;
} = {}) {
  const query = new URLSearchParams();
  
  if (params.Period !== undefined) query.append("Period", params.Period.toString());
  if (params.GroupBy !== undefined) query.append("GroupBy", params.GroupBy.toString());
  if (params.CustomStartDate) query.append("CustomStartDate", params.CustomStartDate);
  if (params.CustomEndDate) query.append("CustomEndDate", params.CustomEndDate);
  if (params.EventManagerId) query.append("EventManagerId", params.EventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/categories/stats?${query.toString()}`);
  return response.data;
}

// Export data
export async function exportDashboardData(params: {
  Period?: number;
  CustomStartDate?: string;
  CustomEndDate?: string;
  Format?: 'xlsx' | 'csv' | 'pdf';
  IncludeCharts?: boolean;
  EventManagerId?: string;
} = {}) {
  const query = new URLSearchParams();
  
  if (params.Period !== undefined) query.append("Period", params.Period.toString());
  if (params.CustomStartDate) query.append("CustomStartDate", params.CustomStartDate);
  if (params.CustomEndDate) query.append("CustomEndDate", params.CustomEndDate);
  if (params.Format) query.append("Format", params.Format);
  if (params.IncludeCharts !== undefined) query.append("IncludeCharts", String(params.IncludeCharts));
  if (params.EventManagerId) query.append("EventManagerId", params.EventManagerId);
  
  const response = await instance.get(`${ANALYTICS_PREFIX}/export?${query.toString()}`, {
    responseType: 'blob'
  });
  return response;
}

// === Event Manager Analytics APIs ===
// const ANALYTICS_PREFIX = "/api/analytics/eventManager";

// type DashboardParams = {
//   period?: number;
//   groupBy?: number;
//   includeMetrics?: string[];
//   includeRealtimeData?: boolean;
//   customStartDate?: string;
//   customEndDate?: string;
//   includeComparison?: boolean;
//   comparisonPeriod?: number;
// };

// type RevenueParams = {
//   eventIds?: string[];
//   categoryIds?: string[];
//   paymentStatus?: number;
//   period?: number;
//   groupBy?: number;
//   customStartDate?: string;
//   customEndDate?: string;
//   includeComparison?: boolean;
//   comparisonPeriod?: number;
// };

// type TicketStatsParams = {
//   period?: number;
//   groupBy?: number;
//   customStartDate?: string;
//   customEndDate?: string;
//   includeComparison?: boolean;
//   comparisonPeriod?: number;
// };

// // Dashboard tổng quan cho Event Manager
// export async function getEventManagerDashboard(params: DashboardParams = {}) {
//   const query = new URLSearchParams();
//   if (params.period) query.append("Period", params.period.toString());
//   if (params.groupBy) query.append("GroupBy", params.groupBy.toString());
//   if (params.includeMetrics) params.includeMetrics.forEach(m => query.append("IncludeMetrics", m));
//   if (params.includeRealtimeData !== undefined) query.append("IncludeRealtimeData", String(params.includeRealtimeData));
//   if (params.customStartDate) query.append("CustomStartDate", params.customStartDate);
//   if (params.customEndDate) query.append("CustomEndDate", params.customEndDate);
//   if (params.includeComparison !== undefined) query.append("IncludeComparison", String(params.includeComparison));
//   if (params.comparisonPeriod) query.append("ComparisonPeriod", params.comparisonPeriod.toString());
//   const response = await instance.get(`${ANALYTICS_PREFIX}/dashboard?${query.toString()}`);
//   return response.data;
// }

// // Thống kê doanh thu Event Manager
// export async function getEventManagerRevenue(params: RevenueParams = {}) {
//   const query = new URLSearchParams();
//   if (params.eventIds) params.eventIds.forEach(id => query.append("EventIds", id));
//   if (params.categoryIds) params.categoryIds.forEach(id => query.append("CategoryIds", id));
//   if (params.paymentStatus !== undefined) query.append("PaymentStatus", params.paymentStatus.toString());
//   if (params.period) query.append("Period", params.period.toString());
//   if (params.groupBy) query.append("GroupBy", params.groupBy.toString());
//   if (params.customStartDate) query.append("CustomStartDate", params.customStartDate);
//   if (params.customEndDate) query.append("CustomEndDate", params.customEndDate);
//   if (params.includeComparison !== undefined) query.append("IncludeComparison", String(params.includeComparison));
//   if (params.comparisonPeriod) query.append("ComparisonPeriod", params.comparisonPeriod.toString());
//   const response = await instance.get(`${ANALYTICS_PREFIX}/revenue?${query.toString()}`);
//   return response.data;
// }

// // Thống kê vé Event Manager
// export async function getEventManagerTicketStats(params: TicketStatsParams = {}) {
//   const query = new URLSearchParams();
//   if (params.period) query.append("Period", params.period.toString());
//   if (params.groupBy) query.append("GroupBy", params.groupBy.toString());
//   if (params.customStartDate) query.append("CustomStartDate", params.customStartDate);
//   if (params.customEndDate) query.append("CustomEndDate", params.customEndDate);
//   if (params.includeComparison !== undefined) query.append("IncludeComparison", String(params.includeComparison));
//   if (params.comparisonPeriod) query.append("ComparisonPeriod", params.comparisonPeriod.toString());
//   const response = await instance.get(`${ANALYTICS_PREFIX}/tickets/stats?${query.toString()}`);
//   return response.data;
// }

// // Sự kiện sắp tới
// export async function getUpcomingEvents() {
//   const response = await instance.get(`${ANALYTICS_PREFIX}/events/upcoming`);
//   return response.data;
// }

// // Tổng quan realtime
// export async function getRealtimeOverview() {
//   const response = await instance.get(`${ANALYTICS_PREFIX}/realtime/overview`);
//   return response.data;
// }

// // So sánh hiệu suất
// export async function comparePerformance(currentPeriod: number, comparisonPeriod: number) {
//   const response = await instance.post(`${ANALYTICS_PREFIX}/performance/compare`, {
//     currentPeriod,
//     comparisonPeriod
//   });
//   return response.data;
// }



// Export Analytics Excel
export async function exportAnalyticsExcel(
  analyticsType: string,
  analyticsData: unknown,
  filter: unknown = {},
  language: number = 0
) {
  const response = await instance.post(
    `/api/analytics/eventManager/analytics/export/excel`,
    {
      analyticsType,
      analyticsData,
      filter,
      language
    },
    { responseType: 'blob' }
  );
  return response.data;
}

// Lấy sự kiện trang chủ (chỉ sự kiện active)
export async function getHomeEvents() {
  try {
    console.log('Fetching home events...');
    const response = await instance.get('/api/Event/home');
    console.log('Home events API response:', response);
    
    // Handle different possible response structures
    if (Array.isArray(response.data)) {
      console.log('Returning direct array from response.data');
      return response.data;
    } else if (Array.isArray(response.data?.data)) {
      console.log('Returning array from response.data.data');
      return response.data.data;
    } else if (response.data?.items) {
      console.log('Returning items from response.data.items');
      return response.data.items;
    } else if (response.data?.data?.items) {
      console.log('Returning items from response.data.data.items');
      return response.data.data.items;
    }
    
    console.warn('Unexpected API response structure:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching home events:', error);
    return [];
  }
}

// === AI Recommend Events ===
export async function getAIRecommendedEvents(): Promise<AIRecommendResponse> {
  const response = await instance.get('/api/Event/recommend');
  return response.data;
}
// === Discount Code APIs ===

export interface DiscountCode {
  discountId: string;
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  usedCount: number;
  expiredAt: string;
  createdAt: string;
  isExpired: boolean;
  isAvailable: boolean;
  remainingUsage: number;
}

export interface CreateDiscountCodePayload {
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum?: number;
  maximum?: number;
  maxUsage?: number;
  expiredAt: string;
}

export interface UpdateDiscountCodePayload {
  code?: string;
  discountType?: number;
  value?: number;
  minimum?: number;
  maximum?: number;
  maxUsage?: number;
  expiredAt?: string;
}

// Create new discount code
export async function createDiscountCode(data: CreateDiscountCodePayload): Promise<DiscountCode> {
  const response = await instance.post("/api/DiscountCode", data);
  return response.data?.data || response.data;
}

// Get discount code by ID
export async function getDiscountCodeById(discountId: string): Promise<DiscountCode> {
  const response = await instance.get(`/api/DiscountCode/${discountId}`);
  return response.data?.data || response.data;
}

// Update discount code
export async function updateDiscountCode(discountId: string, data: UpdateDiscountCodePayload): Promise<DiscountCode> {
  const response = await instance.put(`/api/DiscountCode/${discountId}`, data);
  return response.data?.data || response.data;
}

// Delete discount code
export async function deleteDiscountCode(discountId: string): Promise<boolean> {
  const response = await instance.delete(`/api/DiscountCode/${discountId}`);
  return response.data?.data || response.data;
}