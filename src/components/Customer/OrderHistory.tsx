import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OrderHistoryProps {
  orders: any[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: any) => void;
}

const OrderHistory = ({
  orders,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  onSelectOrder,
}: OrderHistoryProps) => {
  const { t } = useTranslation('profileCustomer');
  const { getThemeClass } = useThemeClasses();

  return (
    <div
      className={cn(
        'flex flex-col items-center w-full min-h-[400px] animate-in fade-in duration-300',
        getThemeClass('', '')
      )}
    >
      <h2
        className={cn(
          'text-2xl font-semibold mb-6 animate-in slide-in-from-top duration-500',
          getThemeClass('text-gray-900', 'text-slate-100')
        )}
      >
        {t('orderHistory')}
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2
            className={cn(
              'animate-spin w-8 h-8 mb-4',
              getThemeClass('text-blue-600', 'text-purple-400')
            )}
          />
          <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-slate-400'))}>
            {t('loadingOrders') || 'Đang tải lịch sử mua vé...'}
          </p>
        </div>
      ) : error ? (
        <div
          className={cn(
            'mb-4 animate-in slide-in-from-left duration-300 p-4 rounded-lg border',
            getThemeClass(
              'text-red-600 bg-red-50/80 border-red-200',
              'text-red-400 bg-red-50/10 border-red-400/20'
            )
          )}
        >
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div
          className={cn(
            'animate-in fade-in duration-500 delay-200 p-8 text-center',
            getThemeClass('text-gray-500', 'text-slate-400')
          )}
        >
          <div className="text-4xl mb-4 opacity-50">📋</div>
          <p>{t('noOrders')}</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto animate-in slide-in-from-bottom duration-500 delay-100">
          <table
            className={cn(
              'min-w-full text-sm text-left rounded-lg overflow-hidden shadow-xl',
              getThemeClass(
                'bg-white/95 border border-gray-200',
                'bg-slate-800/50 backdrop-blur-sm'
              )
            )}
          >
            <thead>
              <tr
                className={cn(
                  'border-b',
                  getThemeClass(
                    'bg-gray-50 text-gray-700 border-gray-200',
                    'bg-slate-700/80 text-slate-100 border-slate-600/50'
                  )
                )}
              >
                <th className="px-4 py-3 font-medium">{t('orderId')}</th>
                <th className="px-4 py-3 font-medium">{t('eventName')}</th>
                <th className="px-4 py-3 font-medium">{t('totalAmount')}</th>
                <th className="px-4 py-3 font-medium">{t('createdAt')}</th>
                <th className="px-4 py-3 font-medium">{t('orderStatus')}</th>
                <th className="px-4 py-3 font-medium">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.orderId}
                  className={cn(
                    'border-b transition-all duration-200 hover:shadow-lg hover:scale-[1.01] animate-in fade-in duration-300',
                    getThemeClass(
                      'border-gray-100 hover:bg-gray-50',
                      'border-slate-600/30 hover:bg-slate-700/50'
                    )
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td
                    className={cn(
                      'px-4 py-3 font-mono text-xs',
                      getThemeClass('text-gray-600', 'text-slate-300')
                    )}
                  >
                    {order.orderId}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 font-medium',
                      getThemeClass('text-gray-900', 'text-slate-200')
                    )}
                  >
                    {order.eventName}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 font-semibold',
                      getThemeClass('text-gray-900', 'text-slate-200')
                    )}
                  >
                    {order.totalAmount?.toLocaleString()}đ
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-xs',
                      getThemeClass('text-gray-500', 'text-slate-300')
                    )}
                  >
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="px-4 py-3">
                    {order.orderStatus === 1 ? (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border animate-pulse',
                          getThemeClass(
                            'text-green-600 bg-green-50 border-green-200',
                            'text-green-400 bg-green-400/10 border-green-400/20'
                          )
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full mr-1.5',
                            getThemeClass('bg-green-600', 'bg-green-400')
                          )}
                        ></span>
                        {t('paid')}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border',
                          getThemeClass(
                            'text-yellow-600 bg-yellow-50 border-yellow-200',
                            'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                          )
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse',
                            getThemeClass('bg-yellow-600', 'bg-yellow-400')
                          )}
                        ></span>
                        {t('pendingPayment')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSelectOrder(order)}
                      className={cn(
                        'hover:scale-105 transition-transform duration-200',
                        getThemeClass(
                          'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200',
                          'bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50'
                        )
                      )}
                    >
                      {t('viewTickets')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-3 animate-in slide-in-from-bottom duration-500 delay-300 items-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className={cn(
                  'hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  getThemeClass(
                    'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300',
                    'bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50'
                  )
                )}
              >
                {t('previous')}
              </Button>
              <div
                className={cn(
                  'flex items-center px-4 py-2 font-medium rounded-md border',
                  getThemeClass(
                    'text-gray-700 bg-gray-100 border-gray-200',
                    'text-slate-300 bg-slate-700/50 border-slate-600/50'
                  )
                )}
              >
                <span className="animate-pulse">{page}</span>
                <span className="mx-2">/</span>
                <span>{totalPages}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className={cn(
                  'hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  getThemeClass(
                    'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300',
                    'bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50'
                  )
                )}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
