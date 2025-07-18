import instance from './axios.customize';

// Theo dõi Event Manager
export async function followEventManager(eventManagerId: string) {
  const response = await instance.post(`/api/Follow/${eventManagerId}`);
  return response.data;
}

// Bỏ theo dõi Event Manager
export async function unfollowEventManager(eventManagerId: string) {
  const response = await instance.delete(`/api/Follow/${eventManagerId}`);
  return response.data;
}

// Kiểm tra đã theo dõi Event Manager chưa
export async function checkFollowEventManager(eventManagerId: string) {
  const response = await instance.get(`/api/Follow/check/${eventManagerId}`);
  return response.data?.data;
}

// Theo dõi sự kiện
export async function followEvent(eventId: string) {
  return instance.post(`/api/Follow/followEvent?eventId=${eventId}`);
}

// Bỏ theo dõi sự kiện
export async function unfollowEvent(eventId: string) {
  return instance.delete(`/api/Follow/unfollowEvent?eventId=${eventId}`);
}

// Lấy danh sách người theo dõi sự kiện bởi userId (Event Manager)
export async function getEventFollowersByUserId(userId: string) {
  const response = await instance.get(`/api/Follow/followingEventByUserId?userId=${userId}`);
  return response.data?.data || [];
}

// Kiểm tra user hiện tại có theo dõi event manager này không
export async function checkUserFollowEventManager(followingAccountId: string) {
  const response = await instance.get(`/api/Follow/check/${followingAccountId}`);
  return response.data?.data;
} 