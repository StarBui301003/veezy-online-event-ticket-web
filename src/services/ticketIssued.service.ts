import instance from './axios.customize';

export async function getTicketsByOrderId(orderId: string) {
  const res = await instance.get(`/api/TicketIssued/order/${orderId}`);
  return res.data;
}

export async function getMyAttendances() {
  const res = await instance.get('/api/TicketIssued/MyAttendances');
  return res.data;
} 