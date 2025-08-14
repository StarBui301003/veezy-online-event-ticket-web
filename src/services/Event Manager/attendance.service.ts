import instance from '@/services/axios.customize';

// Lấy danh sách attendance theo eventId (có phân trang)
export async function getAttendanceByEvent(eventId: string, pageNumber = 1, pageSize = 10) {
  try {
    const response = await instance.get(`/api/TicketIssued/event/${eventId}/attendanceByEvent`, {
      params: { 
        PageNumber: pageNumber, 
        PageSize: pageSize 
      },
      headers: { 
        'Cache-Control': 'no-cache' 
      },
    });
    console.log('API Response from service:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getAttendanceByEvent:', error);
    throw error;
  }
}

// Lấy danh sách tham gia của user hiện tại
export async function getMyAttendances() {
  try {
    const response = await instance.get('/api/TicketIssued/MyAttendances');
    return response.data;
  } catch (error) {
    console.error('Error in getMyAttendances:', error);
    throw error;
  }
}

// Xuất danh sách check-in của sự kiện (file Excel)
export async function exportAttendanceCheckin(eventId: string, language: number = 0) {
  try {
    const response = await instance.get(
      `/api/TicketIssued/event/${eventId}/export-attendance-checkin`,
      {
        params: { language },
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in exportAttendanceCheckin:', error);
    throw error;
  }
}
