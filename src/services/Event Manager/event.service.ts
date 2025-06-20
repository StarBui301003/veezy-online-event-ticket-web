import instance from "@/services/axios.customize";
import { CreateEventData, NewsPayload, CreateTicketData, News } from "@/types/event";

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

// === Order APIs ===

interface OrderItemPayload {
  ticketId: string;
  quantity: number;
}

export interface CreateOrderPayload {
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
    const response = await instance.post("/api/Order", payload);
    // Assuming the API returns the created order directly in response.data for a successful POST
    // or in response.data.data if it follows the GET structure. Adjust as per actual API.
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Failed to create order", error);
    throw error;
  }
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

export async function deleteDiscountCode(id: string) {
  const response = await instance.delete(`/api/DiscountCode/${id}`);
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