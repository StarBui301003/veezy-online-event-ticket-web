import instance from '../axios.customize';
interface ReportData {
    reason: string;
    description: string;
  }
  
  
// Định nghĩa một interface chung cho dữ liệu report
interface ReportData {
    reason: string;
    description: string;
  }
  
  // FIX: Sửa lại các hàm để nhận một object 'data' duy nhất
  export async function reportEvent(eventId: string, data: ReportData) {
    // Gửi thẳng object 'data' đi, nó đã có dạng { reason, description }
    return instance.post(`/api/Report/event/${eventId}`, data);
  }
  
  export async function reportComment(commentId: string, data: ReportData) {
    return instance.post(`/api/Report/comment/${commentId}`, data);
  }
  
  export async function reportNews(newsId:string, data: ReportData) {
    return instance.post(`/api/Report/news/${newsId}`, data);
  }
  
  export async function reportEventManager(eventManagerId: string, data: ReportData) {
    return instance.post(`/api/Report/event-manager/${eventManagerId}`, data);
  }