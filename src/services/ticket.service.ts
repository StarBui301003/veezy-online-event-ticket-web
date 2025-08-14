import instance from './axios.customize';

export interface TicketLimitInfo {
  maxTicketsPerOrder: number;
  maxTicketsPerUser: number;
  userPurchasedCount: number;
  remainingQuantity: number;
  isActive: boolean;
}

export async function getTicketLimits(ticketId: string): Promise<TicketLimitInfo> {
  try {
    const response = await instance.get(`/api/tickets/${ticketId}`);
    return {
      maxTicketsPerOrder: response.data.maxTicketsPerOrder || 10,
      maxTicketsPerUser: response.data.maxTicketsPerUser || 50,
      userPurchasedCount: response.data.userPurchasedCount || 0,
      remainingQuantity: response.data.remainingQuantity || 0,
      isActive: response.data.isActive !== false
    };
  } catch (error) {
    console.error('Error fetching ticket limits:', error);
    // Return safe default values if API fails
    return {
      maxTicketsPerOrder: 5, // Conservative default
      maxTicketsPerUser: 10,  // Conservative default
      userPurchasedCount: 0,
      remainingQuantity: 0,
      isActive: true
    };
  }
}

interface FreeOrderPayload {
  eventId: string;
  customerId: string;
  items: Array<{
    ticketId: string;
    quantity: number;
    pricePerTicket: number;
  }>;
}

export async function processFreeOrder(payload: FreeOrderPayload): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await instance.post('/api/Payment/process-free-order', {
      ...payload,
      // Add any additional required fields for the API
      orderAmount: 0,
      discountAmount: 0,
      paymentMethod: 'free',
      paymentStatus: 'completed',
      orderStatus: 'completed',
    });
    
    return {
      success: true,
      message: response.data.message || 'Đặt vé miễn phí thành công',
      data: response.data
    };
  } catch (error: any) {
    console.error('Error processing free order:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Có lỗi xảy ra khi xử lý đơn hàng miễn phí';
    return {
      success: false,
      message: errorMessage
    };
  }
}