import { eventInstance, ticketInstance } from "@/services/axios.customize";
import { CreateEventData, TicketPayload } from "@/types/event";
import { CreateTicketData } from "@/types/event";

// === Event APIs ===

export async function createEvent(data: CreateEventData) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.post(
    "/api/Event",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      validateStatus: (status) => status >= 200 && status < 300,
    }
  );

  return response.data || null;
}

// category
export async function getAllCategories() {
  try {
    const response = await eventInstance.get("/api/Category");
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
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await eventInstance.post(
      "/api/Event/upload-image",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.get(`/api/Event/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data?.data || response.data;
}

// === Get My Events ===
export async function getMyEvents(page = 1, pageSize = 100) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data?.data || response.data;
}

// === Get My Approved Events ===
export async function getMyApprovedEvents(page = 1, pageSize = 100) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
  return items.filter(event => event.isApproved === 1 && !event.isCancelled);
}

// === Cancel Event ===
export async function cancelEvent(eventId: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.post(
    `/api/Event/${eventId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data?.data || response.data;
}

// === Update Event ===
export async function updateEvent(eventId: string, data: CreateEventData) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.put(
    `/api/Event/${eventId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data?.data || response.data;
}

// === Delete Event Image ===
export async function deleteEventImage(imageUrl: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  return eventInstance.delete(
    `/api/Event/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// === Get My Events With Status & Search ===
export async function getMyEventsWithStatus(filter: string, searchTerm: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.get(
    `/api/Event?filter=${filter}&searchTerm=${searchTerm}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return Array.isArray(response.data?.data) ? response.data.data :
         Array.isArray(response.data) ? response.data : [];
}

// === Get All Events (public) ===
export async function getAllEvents(page = 1, pageSize = 12) {
  try {
    const response = await eventInstance.get("/api/Event", {
      params: { page, pageSize }
    });
    // Lấy đúng mảng items từ response
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
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.post(
    `/api/Event/${eventId}/resend-approval`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data?.data || response.data;
}

// === Get My Pending Events ===
export async function getMyPendingEvents(page = 1, pageSize = 100) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await eventInstance.get(
    `/api/Event/creator?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
  return items.filter(event => event.isApproved === 0 && !event.isCancelled);
}

// === Ticket APIs ===

export async function createTicket(data: TicketPayload) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.post(
    "/api/Ticket",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data?.data || response.data;
}

// Lấy danh sách vé của 1 event
export async function getTicketsByEvent(eventId: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.get(
    `/api/Ticket/event/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
}

// Tìm kiếm vé theo từ khóa
export async function searchTickets(keyword: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.get(
    `/api/Ticket/search?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data?.data || response.data;
}

// Cập nhật vé
export async function updateTicket(id: string, data: Partial<CreateTicketData>) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.put(
    `/api/Ticket/${id}`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data?.data || response.data;
}

// Xóa vé
export async function deleteTicket(id: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.delete(
    `/api/Ticket/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data?.data || response.data;
}

// Đổi trạng thái vé
export async function updateTicketStatus(id: string, status: string) {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Authentication token not found.");

  const response = await ticketInstance.put(
    `/api/Ticket/${id}/status`,
    { status },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data?.data || response.data;
}