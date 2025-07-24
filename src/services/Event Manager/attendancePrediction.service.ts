import instance from '@/services/axios.customize';

export const getEventAttendancePrediction = async (eventId) => {
  if (!eventId) throw new Error('eventId is required');
  const res = await instance.get('/api/Event/suggest-quantity', { params: { eventId } });
  return res.data;
};
