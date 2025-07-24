
import instance from '@/services/axios.customize';

export const analyzeEventSentiment = async (eventId) => {
  if (!eventId) throw new Error('eventId is required');
  const res = await instance.get('/api/Comment/analyze-sentiment', { params: { eventId } });
  let data = res.data?.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch {
      // intentionally ignore JSON parse errors
    }
  }
  return { ...res.data, data };
};
