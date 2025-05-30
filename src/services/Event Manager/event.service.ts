import instance from "@/services/axios.customize";
import { CreateEventData, TicketPayload } from "@/types/event";
import { CreateTicketData } from "@/types/event";

// === Event APIs ===

export async function createEvent(data: CreateEventData) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
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
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const response = await instance.post(
    `/api/Event/${eventId}/cancel`,
    {}
  );
  return response.data?.data || response.data;
}

// === Update Event ===
export async function updateEvent(eventId: string, data: CreateEventData) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  const response = await instance.put(
    `/api/Event/${eventId}`,
    data
  );
  return response.data?.data || response.data;
}

// === Delete Event Image ===
export async function deleteEventImage(imageUrl: string) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
  return instance.delete(
    `/api/Event/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`
  );
}

// === Get My Events With Status & Search ===
export async function getMyEventsWithStatus(filter: string, searchTerm: string) {
  // Không cần lấy access_token, axios.customize sẽ tự động gắn token nếu có
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

export async function createTicket(data: TicketPayload) {
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