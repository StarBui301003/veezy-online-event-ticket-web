import { useEffect, useState } from 'react';
import {
  getMyApprovedEvents,
  getDiscountCodesByEvent,
  deleteDiscountCode,
} from '@/services/Event Manager/event.service';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Event {
  eventId: string;
  eventName: string;
  startAt?: string;
  endAt?: string;
}

interface DiscountCode {
  discountId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  usedCount: number;
  expiredAt: string;
  eventId: string;
  eventName: string;
  isExpired: boolean;
}

const EVENTS_PER_PAGE = 3;

export default function ManagerDiscountCode() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [searchEvent, setSearchEvent] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Load events with pagination
  const loadEvents = async (page: number = eventPage) => {
    setLoadingEvents(true);
    try {
      const data = await getMyApprovedEvents(page, EVENTS_PER_PAGE);
      
      const items = Array.isArray(data?.items) ? data.items : [];
      
      // Set total count từ API response
      setTotalEvents(data?.totalCount || 0);
      
      // Luôn luôn replace events cho từng page (không append)
      setEvents(items);
      setFilteredEvents(items);
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error(t('failedToLoadEvents'));
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tìm kiếm sự kiện realtime
  useEffect(() => {
    if (!searchEvent.trim()) {
      setIsSearching(false);
      setFilteredEvents(events);
    } else {
      setIsSearching(true);
      const filtered = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
      );
      setFilteredEvents(filtered);
      setEventPage(1); // reset về trang 1 khi search khác
    }
  }, [searchEvent, events]);

  // Phân trang sự kiện
  const totalEventPages = isSearching 
    ? Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE))
    : Math.max(1, Math.ceil(totalEvents / EVENTS_PER_PAGE));
    
  const pagedEvents = isSearching 
    ? filteredEvents.slice(
        (eventPage - 1) * EVENTS_PER_PAGE,
        eventPage * EVENTS_PER_PAGE
      )
    : filteredEvents; // Khi không search, hiển thị tất cả events đã load

  // Xử lý chuyển trang
  const handlePageChange = async (newPage: number) => {
    if (newPage === eventPage || loadingEvents) return;
    
    setEventPage(newPage);
    
    // Nếu đang search, chỉ cần update page state để show filtered results
    if (isSearching) {
      return;
    }
    
    // Nếu không search, gọi API để load page mới
    await loadEvents(newPage);
  };

  // Nếu chuyển trang mà không còn sự kiện, về trang 1
  useEffect(() => {
    if (eventPage > totalEventPages && totalEventPages > 0) {
      setEventPage(1);
    }
  }, [totalEventPages, eventPage]);

  // Load discount codes when event selected
  useEffect(() => {
    if (!selectedEvent) {
      setDiscountCodes([]);
      return;
    }

    const fetchDiscountCodes = async () => {
      setLoadingDiscountCodes(true);
      try {
        const data = await getDiscountCodesByEvent(selectedEvent.eventId);
        setDiscountCodes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load discount codes:', err);
        toast.error(t('failedToLoadDiscountCodes'));
      } finally {
        setLoadingDiscountCodes(false);
      }
    };

    fetchDiscountCodes();
  }, [selectedEvent, t]);

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm(t('confirmDeleteDiscountCode'))) return;

    try {
      await deleteDiscountCode(codeId);
      toast.success(t('discountCodeDeleted'));
      if (selectedEvent) {
        const data = await getDiscountCodesByEvent(selectedEvent.eventId);
        setDiscountCodes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to delete discount code:', err);
      toast.error(t('failedToDeleteDiscountCode'));
    }
  };

  return (
    <div
      className={cn(
        'w-full min-h-screen flex items-center justify-center py-0 px-0',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div
        className={cn(
          'w-full max-w-7xl mx-auto rounded-2xl shadow-2xl p-8 mt-10 mb-10 flex flex-col md:flex-row gap-10',
          getThemeClass('bg-white/95 border border-gray-200 shadow-lg', 'bg-[#2d0036]/80')
        )}
      >
        {/* Left column: Events list */}
        <div className="w-full md:w-1/3">
          <h2
            className={cn(
              'text-2xl font-extrabold bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 to-purple-600',
                'bg-gradient-to-r from-pink-400 to-yellow-400'
              )
            )}
          >
            {t('myEvents')}
          </h2>
          <input
            type="text"
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder={t('searchEvents')}
            className={cn(
              'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-4',
              getThemeClass(
                'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
              )
            )}
          />

          {loadingEvents ? (
            <div
              className={cn(
                'text-base text-center',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loading')}...
            </div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div
                  className={cn(
                    'text-center text-base',
                    getThemeClass('text-gray-600', 'text-slate-300')
                  )}
                >
                  {t('noEventsFound')}
                </div>
              )}

              {pagedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={cn(
                    'cursor-pointer rounded-xl p-5 shadow-xl border-2 transition-all duration-200',
                    selectedEvent?.eventId === event.eventId
                      ? getThemeClass(
                          'bg-gradient-to-r from-blue-500/60 to-purple-500/60 border-blue-400 ring-4 ring-blue-400/60 scale-105',
                          'bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 border-pink-500/20 ring-4 ring-yellow-400/60 scale-105'
                        )
                      : getThemeClass(
                          'bg-gradient-to-r from-blue-100/60 to-purple-100/60 border-blue-200 hover:ring-2 hover:ring-blue-400/60 hover:scale-105',
                          'bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 border-pink-500/20 hover:ring-2 hover:ring-pink-400/60 hover:scale-105'
                        )
                  )}
                  onClick={() => setSelectedEvent(event)}
                  style={{ minHeight: 90 }}
                >
                  <div
                    className={cn(
                      'text-base font-bold mb-1',
                      getThemeClass('text-blue-600', 'text-pink-200')
                    )}
                  >
                    {event.eventName}
                  </div>
                  <div
                    className={cn('text-xs mb-1', getThemeClass('text-gray-600', 'text-slate-300'))}
                  >
                    {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                  </div>
                  <button
                    className={cn(
                      'mt-2 w-full text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base',
                      getThemeClass(
                        'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                        'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      )
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event-manager/discount-codes/create/${event.eventId}`);
                    }}
                  >
                    <FaPlus className="inline mr-2" /> {t('createDiscountCode')}
                  </button>
                </div>
              ))}


              {totalEventPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={eventPage === 1 || loadingEvents}
                    onClick={() => handlePageChange(Math.max(1, eventPage - 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className={cn('font-bold', getThemeClass('text-blue-600', 'text-white'))}>
                    {t('page')} {eventPage}/{totalEventPages}
                    {loadingEvents && (
                      <span className="ml-2 text-sm opacity-70">({t('loading')}...)</span>
                    )}
                  </span>
                  <button
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={eventPage === totalEventPages || loadingEvents}
                    onClick={() => handlePageChange(Math.min(totalEventPages, eventPage + 1))}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Discount codes */}
        <div className="w-full md:w-2/3">
          {selectedEvent ? (
            <>
              <h3
                className={cn(
                  'text-2xl font-bold mb-5 text-center md:text-left',
                  getThemeClass('text-blue-600', 'text-yellow-300')
                )}
              >
                {t('discountCodesFor')}{' '}
                <span className={cn(getThemeClass('text-purple-600', 'text-pink-200'))}>
                  {selectedEvent.eventName}
                </span>
              </h3>

              {loadingDiscountCodes ? (
                <div
                  className={cn(
                    'text-base text-center',
                    getThemeClass('text-blue-600', 'text-pink-400')
                  )}
                >
                  {t('loading')}...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {discountCodes.map((code) => (
                    <div
                      key={code.discountId}
                      className={cn(
                        'rounded-2xl p-6 shadow-2xl border-2 relative',
                        code.isExpired
                          ? getThemeClass('border-red-500/50', 'border-red-500/50')
                          : getThemeClass('border-blue-300/30', 'border-pink-500/30'),
                        getThemeClass(
                          'bg-gradient-to-br from-blue-50/80 to-purple-50/80',
                          'bg-gradient-to-br from-[#3a0ca3]/80 to-[#ff008e]/80'
                        )
                      )}
                    >
                      {code.isExpired && (
                        <div
                          className={cn(
                            'absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full',
                            getThemeClass('bg-red-500', 'bg-red-500')
                          )}
                        >
                          {t('expired')}
                        </div>
                      )}

                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/event-manager/discount-codes/edit/${code.discountId}`)
                          }
                          className={cn(
                            'p-2 transition-colors duration-200',
                            getThemeClass(
                              'text-blue-600 hover:text-blue-800',
                              'text-blue-300 hover:text-blue-100'
                            )
                          )}
                          title={t('edit')}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.discountId)}
                          className={cn(
                            'p-2 transition-colors duration-200',
                            getThemeClass(
                              'text-red-600 hover:text-red-800',
                              'text-red-400 hover:text-red-300'
                            )
                          )}
                          title={t('delete')}
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div
                        className={cn(
                          'text-lg font-bold mb-2',
                          getThemeClass('text-blue-600', 'text-yellow-200')
                        )}
                      >
                        {code.code}
                      </div>

                      <div
                        className={cn(
                          'text-base mb-2',
                          getThemeClass('text-gray-700', 'text-slate-200')
                        )}
                      >
                        <span className="font-semibold">{t('type')}:</span>{' '}
                        <span
                          className={cn(
                            'font-bold',
                            getThemeClass('text-purple-600', 'text-pink-200')
                          )}
                        >
                          {code.discountType === 0 ? t('percentage') : t('fixedAmount')}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'text-base mb-2',
                          getThemeClass('text-gray-700', 'text-slate-200')
                        )}
                      >
                        <span className="font-semibold">{t('value')}:</span>{' '}
                        <span
                          className={cn(
                            'font-bold',
                            getThemeClass('text-purple-600', 'text-pink-200')
                          )}
                        >
                          {code.discountType === 0
                            ? `${code.value}%`
                            : `${code.value.toLocaleString()}₫`}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'text-sm mb-2',
                          getThemeClass('text-gray-600', 'text-slate-200')
                        )}
                      >
                        <span className="font-semibold">{t('minOrder')}:</span>{' '}
                        <span
                          className={cn('font-bold', getThemeClass('text-gray-900', 'text-white'))}
                        >
                          {code.minimum.toLocaleString()}₫
                        </span>
                      </div>

                      {code.discountType === 0 && (
                        <div
                          className={cn(
                            'text-sm mb-2',
                            getThemeClass('text-gray-600', 'text-slate-200')
                          )}
                        >
                          <span className="font-semibold">{t('maxDiscount')}:</span>{' '}
                          <span
                            className={cn(
                              'font-bold',
                              getThemeClass('text-gray-900', 'text-white')
                            )}
                          >
                            {code.maximum.toLocaleString()}₫
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          'text-sm mb-2',
                          getThemeClass('text-gray-600', 'text-slate-200')
                        )}
                      >
                        <span className="font-semibold">{t('maxUsage')}:</span>{' '}
                        <span
                          className={cn('font-bold', getThemeClass('text-gray-900', 'text-white'))}
                        >
                          {code.maxUsage === 2147483647 ? t('unlimited') : code.maxUsage}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'text-sm mb-2',
                          getThemeClass('text-gray-600', 'text-slate-200')
                        )}
                      >
                        <span className="font-semibold">{t('used')}:</span>{' '}
                        <span
                          className={cn('font-bold', getThemeClass('text-gray-900', 'text-white'))}
                        >
                          {code.usedCount}
                        </span>
                      </div>

                      <div
                        className={cn('text-sm', getThemeClass('text-gray-600', 'text-slate-200'))}
                      >
                        <span className="font-semibold">{t('expiresAt')}:</span>{' '}
                        <span
                          className={cn('font-bold', getThemeClass('text-gray-900', 'text-white'))}
                        >
                          {format(new Date(code.expiredAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {discountCodes.length === 0 && (
                    <div
                      className={cn(
                        'col-span-2 text-center py-8 text-base',
                        getThemeClass('text-gray-600', 'text-slate-300')
                      )}
                    >
                      {t('noDiscountCodesForThisEvent')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div
              className={cn(
                'text-center text-lg mt-10',
                getThemeClass('text-gray-600', 'text-slate-300')
              )}
            >
              {t('selectEventToManageDiscountCodes')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
