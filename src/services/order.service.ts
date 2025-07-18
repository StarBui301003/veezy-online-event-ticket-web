import instance from './axios.customize';

export async function getOrderHistoryByCustomerId(customerId: string, pageNumber = 1, pageSize = 10) {
  const res = await instance.get(`/api/Order/customer/${customerId}`, {
    params: { PageNumber: pageNumber, PageSize: pageSize },
  });
  return res.data;
} 