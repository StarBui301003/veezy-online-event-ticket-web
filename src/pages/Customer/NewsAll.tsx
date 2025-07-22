import React, { useEffect, useState } from 'react';
import { getAllNewsHome } from '@/services/Event Manager/event.service';
import { News } from '@/types/event';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PAGE_SIZE = 8;
const BG_GRADIENTS = [
  'from-pink-500/30 to-purple-500/30',
  'from-blue-500/30 to-cyan-500/30',
  'from-yellow-400/30 to-pink-400/30',
  'from-green-400/30 to-blue-400/30',
  'from-purple-500/30 to-indigo-500/30',
];

function getGradient(idx: number) {
  return BG_GRADIENTS[idx % BG_GRADIENTS.length];
}

const NewsAll: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews(page);
    // eslint-disable-next-line
  }, [page]);

  const fetchNews = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getAllNewsHome(pageNum, PAGE_SIZE);
      const items = res.data?.data?.items || [];
      setNewsList(items);
      setTotalPages(res.data?.data?.totalPages || 1);
    } catch {
      setNewsList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10 overflow-visible">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-titleGlow mb-4 overflow-visible"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t('allNewsTitle')}
          </motion.h1>
          <motion.p
            className="text-xl text-cyan-200 mb-8 animate-fadeInUp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t('discoverLatestNews')}
          </motion.p>
        </div>
        {/* News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 px-4 pb-20 max-w-7xl mx-auto">
          {loading ? (
            <div className="col-span-full text-center text-2xl text-pink-400 py-20 animate-pulse">
              {t('loadingNews')}
            </div>
          ) : newsList.length === 0 ? (
            <div className="col-span-full text-center text-lg text-gray-400 py-20">
              {t('noNewsFound')}
            </div>
          ) : (
            newsList.map((news, idx) => (
              <motion.div
                key={news.newsId}
                className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-105 hover:shadow-2xl hover:border-white/40 animate-cardFloat ${'bg-gradient-to-br ' + getGradient(idx)}`}
                style={{ animationDelay: `${idx % 2 === 0 ? 0 : 4}s` }}
                initial={{ opacity: 0, y: 40, scale: 0.97, rotate: -2 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.07 }}
                whileHover={{ scale: 1.06, rotate: [0, 2, -2, 0], boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
                onClick={() => navigate(`/news/${news.newsId}`)}
              >
                <div className="relative w-full h-52 bg-cover bg-center">
                  {news.imageUrl ? (
                    <img
                      src={news.imageUrl}
                      alt={news.newsTitle}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-900/40">
                      <span className="text-4xl text-gray-400">📰</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {news.eventId && (
                      <span
                        className="genre-badge bg-gradient-to-r from-pink-400 to-cyan-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow hover:scale-105 transition-all cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/event/${news.eventId}`); }}
                      >
                        {t('eventBadge')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-200">
                    {news.newsTitle}
                  </h2>
                  {/* Author */}
                  {news.authorId ? (
                    <div className="text-xs text-cyan-200 mb-2 italic">
                      {t('author')} {news.authorId}
                    </div>
                  ) : null}
                  <p className="text-gray-200 text-base flex-1 mb-2 line-clamp-3">{news.newsDescription}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-cyan-300">
                    <span>
                      {news.createdAt ? new Date(news.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              className="p-4 rounded-full bg-gradient-to-r from-pink-400 to-cyan-400 text-white text-xl font-bold disabled:opacity-50 hover:brightness-110 transition-colors shadow-lg"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <span className="text-cyan-200 font-bold text-xl">
              {t('page')} {page}/{totalPages}
            </span>
            <button
              className="p-4 rounded-full bg-gradient-to-r from-pink-400 to-cyan-400 text-white text-xl font-bold disabled:opacity-50 hover:brightness-110 transition-colors shadow-lg"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
      {/* Custom CSS for animation */}
      <style>{`
        @keyframes titleGlow {
          0% { filter: drop-shadow(0 0 10px rgba(255,107,107,0.7)); }
          50% { filter: drop-shadow(0 0 20px rgba(78,205,196,0.7)); }
          100% { filter: drop-shadow(0 0 15px rgba(69,183,209,0.7)); }
        }
        .animate-titleGlow { animation: titleGlow 4s ease-in-out infinite alternate; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out 0.5s both;}
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px);}
          50% { transform: translateY(-15px);}
        }
        .animate-cardFloat { animation: cardFloat 8s ease-in-out infinite;}
      `}</style>
    </div>
  );
};

export default NewsAll; 