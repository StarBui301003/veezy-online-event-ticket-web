import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const events = [
  {
    id: 1,
    title: 'RAVE IN THE CITY',
    location: 'Ho Chi Minh City',
    date: '2025-06-10',
    coverImage: 'https://images.unsplash.com/photo-1582719478175-ff7c5c9da1e8',
  },
  {
    id: 2,
    title: 'NEON BEATS FESTIVAL',
    location: 'Da Nang',
    date: '2025-07-12',
    coverImage: 'https://images.unsplash.com/photo-1549921296-3a26f982a853',
  },
  {
    id: 3,
    title: 'ART & MUSIC NIGHT',
    location: 'Hanoi',
    date: '2025-08-05',
    coverImage: 'https://images.unsplash.com/photo-1526178610531-d6f542f1b001',
  },
];

export default function EventManagerHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white p-8 font-extrabold">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-600 animate-pulse">
          EVENT MANAGER
        </h1>
        <Link to="/event-manager/create-event">
          <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl text-lg shadow-lg">
            <Plus size={20} /> Tạo Sự Kiện Mới
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            className="w-full p-4 pl-12 rounded-full bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-inner"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={22} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {events.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
          >
            <Card className="bg-zinc-900">
              <div
                className="h-56 bg-cover bg-center"
                style={{ backgroundImage: `url(${event.coverImage})` }}
              ></div>
              <CardContent className="p-5 flex flex-col h-full">
                <h2 className="text-2xl text-pink-400 mb-2 uppercase tracking-wide min-h-[4rem]">
                  {event.title}
                </h2>

                <p className="text-sm text-zinc-300 mb-1">📍 {event.location}</p>
                <p className="text-sm text-zinc-400">🗓 {event.date}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
