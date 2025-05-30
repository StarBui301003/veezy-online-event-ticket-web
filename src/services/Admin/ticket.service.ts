import { AdminTicketListResponse } from "@/types/Admin/event";
import instance from "@/services/axios.customize";


// API: Get tickets by eventId (Admin)
export async function getTicketsByEventAdmin(eventId: string) {
  const res = await instance.get<AdminTicketListResponse>(`/api/Ticket/event/${eventId}`);
  return res.data;
}