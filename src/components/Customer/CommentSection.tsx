/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import instance from '@/services/axios.customize';
import { Loader2, Send, MoreVertical, Flag } from 'lucide-react';
import { LoginModal } from '@/components/common/LoginModal';
import { RegisterModal } from '@/components/RegisterModal';
import { toast } from 'react-toastify';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { onComment } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Comment {
  commentId: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
}

interface UserData {
  userId: string;
  fullName: string;
  avatar: string;
}

const getLoggedInUser = (): UserData | null => {
  try {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      const acc = JSON.parse(accStr);
      // Ưu tiên userId, nếu không có thì lấy accountId
      const userId = acc.userId || acc.accountId || '';
      return {
        userId,
        fullName: acc.fullName || acc.username || '',
        avatar: acc.avatar || '',
      };
    }
    return null;
  } catch {
    return null;
  }
};

export default function CommentSection({
  eventId,
  setReportModal,
}: {
  eventId: string;
  setReportModal: (v: { type: 'comment'; id: string }) => void;
}) {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCount, setShowCount] = useState(3);
  const [showComment, setShowComment] = useState(true);
  const loggedInUser = getLoggedInUser();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchComments = () => {
    setLoading(true);
    instance
      .get(`/api/Comment/event/${eventId}`)
      .then((res) => {
        const apiData = res.data?.data;
        if (Array.isArray(apiData)) {
          setComments(
            apiData.map((c: unknown) => {
              if (
                typeof c === 'object' &&
                c !== null &&
                'commentId' in c &&
                'userId' in c &&
                'content' in c &&
                'createdAt' in c
              ) {
                const obj = c as Partial<Comment> & { fullName?: string; avatarUrl?: string };
                return {
                  commentId: obj.commentId ?? '',
                  userId: obj.userId ?? '',
                  fullName: obj.fullName || 'Ẩn danh',
                  avatarUrl:
                    obj.avatarUrl || 'https://via.placeholder.com/150/94a3b8/ffffff?text=U',
                  content: obj.content ?? '',
                  createdAt: obj.createdAt ?? '',
                };
              }
              return {
                commentId: '',
                userId: '',
                fullName: 'Ẩn danh',
                avatarUrl: 'https://via.placeholder.com/150/94a3b8/ffffff?text=U',
                content: '',
                createdAt: '',
              };
            })
          );
        } else {
          setComments([]);
        }
      })
      .catch(() => {
        toast.error(t('cannotLoadComments'));
        setComments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (eventId) {
      fetchComments();
      // Comment hub connection is managed globally in App.tsx (Event Hub handles comments)
      // Lắng nghe realtime SignalR cho comment
      const reloadComment = (data: any) => {
        if (data?.eventId === eventId || data === eventId) {
          fetchComments();
        }
      };
      onComment('OnCommentCreated', reloadComment);
      onComment('OnCommentUpdated', reloadComment);
      onComment('OnCommentDeleted', reloadComment);
    }
  }, [eventId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !loggedInUser) return;
    setPosting(true);
    try {
      // Get both userId and accountId
      const accStr = localStorage.getItem('account');
      let userId = loggedInUser.userId;
      let accountId = '';
      if (accStr) {
        const acc = JSON.parse(accStr);
        accountId = acc.accountId || '';
        // Fallback: if userId is empty, use accountId
        if (!userId && accountId) userId = accountId;
      }
      // Log for debugging
      const response = await instance.post('/api/Comment', {
        eventId,
        content: newComment.trim(),
        userId,
        accountId,
      });
      if (response.data && response.data.flag === false) {
        throw new Error(
          (response.data.message || t('postCommentFailed')) +
            ` [userId: ${userId}, accountId: ${accountId}]`
        );
      }
      setNewComment('');
      toast.success(t('commentSent'));
      fetchComments();
    } catch (err) {
      const error = err as Error | { response?: { data?: { message?: string } } };
      let errorMessage: string | undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { message?: string } } };
        errorMessage = errObj.response?.data?.message;
      }
      if (!errorMessage) errorMessage = t('postCommentFailed');
      // Show both IDs in error toast for easier backend debugging
      toast.error(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  // Edit comment handler
  const handleEdit = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
  };
  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await instance.put(`/api/Comment/${commentId}`, { content: editContent.trim() });
      toast.success(t('editCommentSuccess') || 'Đã sửa bình luận!');
      setEditingCommentId(null);
      setEditContent('');
      fetchComments();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error(t('editCommentFailed') || 'Sửa bình luận thất bại!');
    }
  };

  // Delete comment handler (show modal)
  const handleDelete = (commentId: string) => {
    setDeleteConfirmId(commentId);
  };
  // Confirm delete
  const confirmDelete = async (commentId: string) => {
    try {
      await instance.delete(`/api/Comment/${commentId}`);
      toast.success(t('deleteCommentSuccess') || 'Đã xóa bình luận!');
      setDeleteConfirmId(null);
      fetchComments();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error(t('deleteCommentFailed') || 'Xóa bình luận thất bại!');
    }
  };
  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Any additional logic after successful login
  };

  const handleRegisterRedirect = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleLoginRedirect = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    // Any additional logic after successful registration
  };

  // Hiển thị tối đa 3 comment, có nút xem thêm
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const visibleComments = sortedComments.slice(0, showCount);
  const isScrollable = showCount > 3 && sortedComments.length > 3;

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Kiểm tra xem có phải click vào dropdown hoặc modal không
      const target = event.target as Element;
      const isDropdownClick = target.closest('[data-dropdown]');
      const isModalClick = target.closest('[data-modal]') || target.closest('[role="dialog"]');

      if (openDropdownId && !isDropdownClick && !isModalClick) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Đóng dropdown khi login modal mở
  useEffect(() => {
    if (showLoginModal || showRegisterModal) {
      setOpenDropdownId(null);
    }
  }, [showLoginModal, showRegisterModal]);

  // Đóng dropdown khi có modal khác mở (report modal, delete confirm, etc.)
  useEffect(() => {
    const checkForModals = () => {
      // Kiểm tra các modal khác có thể mở
      const hasReportModal = document.querySelector('[data-report-modal]');
      const hasDeleteModal = document.querySelector('[data-delete-modal]');
      const hasAnyModal = document.querySelector('[role="dialog"], [data-modal], .modal, .Modal');

      if (hasReportModal || hasDeleteModal || hasAnyModal) {
        setOpenDropdownId(null);
      }
    };

    // Kiểm tra ngay lập tức
    checkForModals();

    // Theo dõi thay đổi DOM để phát hiện modal mới
    const observer = new MutationObserver(checkForModals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-modal', 'role'],
    });

    return () => observer.disconnect();
  }, []);

  // Đóng dropdown khi delete confirm modal mở
  useEffect(() => {
    if (deleteConfirmId) {
      setOpenDropdownId(null);
    }
  }, [deleteConfirmId]);

  // Đóng dropdown khi edit mode được kích hoạt
  useEffect(() => {
    if (editingCommentId) {
      setOpenDropdownId(null);
    }
  }, [editingCommentId]);

  // Đóng dropdown khi có action khác (edit, delete, report)
  const closeDropdown = () => {
    setOpenDropdownId(null);
  };

  // Đóng dropdown ngay lập tức khi mở login modal
  const handleReportClick = (commentId: string) => {
    if (!loggedInUser) {
      closeDropdown(); // Đóng dropdown trước
      setShowLoginModal(true); // Sau đó mở login modal
      return;
    }
    setReportModal({ type: 'comment', id: commentId });
    closeDropdown();
  };

  return (
    <div
      className={cn('mt-8 transition-all duration-300', !showComment ? ' mb-0' : '')}
      style={{ overscrollBehavior: 'contain' }}
    >
      <button
        onClick={() => setShowComment((v) => !v)}
        className={cn(
          'w-full flex justify-between items-center text-lg font-semibold pb-3 focus:outline-none px-4 py-2 rounded-lg transition-all duration-200',
          getThemeClass(
            'text-blue-600 border-b border-blue-300 bg-blue-50/50 hover:bg-blue-100',
            'text-purple-300 border-b border-purple-700 bg-slate-900/60 hover:bg-slate-800'
          ),
          showComment ? 'mb-0' : 'mb-0'
        )}
        type="button"
      >
        {t('eventDetail.commentDiscussion')}
        <span>{showComment ? '▲' : '▼'}</span>
      </button>
      {showComment && (
        <>
          {/* Khung nhập chat luôn ghim trên đầu */}
          <div
            className={cn(
              'p-5',
              getThemeClass(
                'border-b border-blue-300 bg-blue-50/50 hover:bg-blue-100',
                'border-b border-purple-700 bg-slate-900/60 hover:bg-slate-800'
              )
            )}
          >
            {loggedInUser ? (
              <form onSubmit={handlePost} className="flex items-start gap-4 mb-4">
                <img
                  src={
                    loggedInUser.avatar || 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'
                  }
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://via.placeholder.com/150/94a3b8/ffffff?text=U';
                  }}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover shadow-md"
                />
                <div className="flex-1">
                  <textarea
                    className={cn(
                      'w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition',
                      getThemeClass(
                        'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                        'bg-slate-700 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500'
                      )
                    )}
                    placeholder={t('writeComment') || `Viết bình luận của bạn...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={posting}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                        getThemeClass(
                          'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
                          'bg-purple-600 text-white hover:bg-purple-700'
                        )
                      )}
                      disabled={posting || !newComment.trim()}
                    >
                      {posting ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      <span>{posting ? t('sending') : t('send')}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div
                className={cn(
                  'text-center py-4 text-sm',
                  getThemeClass('text-gray-600', 'text-slate-400')
                )}
              >
                {t('eventDetail.loginToCommentMessage')}
                <a
                  href="/login"
                  className={cn(
                    'font-semibold hover:underline',
                    getThemeClass(
                      'text-blue-600 hover:text-blue-700',
                      'text-purple-400 hover:text-purple-300'
                    )
                  )}
                >
                  {t('eventDetail.login')}
                </a>
              </div>
            )}
          </div>
          {/* Danh sách comment */}
          <div className={`flex-1 p-6 space-y-6${isScrollable ? ' overflow-y-auto' : ''}`}>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2
                  className={cn(
                    'animate-spin w-8 h-8',
                    getThemeClass('text-blue-600', 'text-purple-400')
                  )}
                />
              </div>
            ) : (
              <>
                {visibleComments.length === 0 ? (
                  <div
                    className={cn(
                      'text-center py-4',
                      getThemeClass('text-gray-500', 'text-slate-400')
                    )}
                  >
                    {t('noCommentsFound')}
                  </div>
                ) : (
                  visibleComments.map((c) => (
                    <div key={c.commentId} className="flex items-start gap-4 relative">
                      <img
                        src={c.avatarUrl}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://via.placeholder.com/150/94a3b8/ffffff?text=U';
                        }}
                        alt={`${c.fullName}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover shadow-md"
                      />
                      <div
                        className={cn(
                          'flex-1 p-4 rounded-lg shadow-sm',
                          getThemeClass('bg-gray-50 border border-gray-200', 'bg-slate-700')
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              'font-semibold',
                              getThemeClass('text-gray-900', 'text-purple-300')
                            )}
                          >
                            {c.fullName}
                          </p>
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                'text-xs',
                                getThemeClass('text-gray-500', 'text-slate-400')
                              )}
                            >
                              {new Date(c.createdAt).toLocaleString('vi-VN')}
                            </p>
                            <DropdownMenu
                              open={openDropdownId === c.commentId}
                              onOpenChange={(open) => {
                                setOpenDropdownId(open ? c.commentId : null);
                              }}
                              modal={false}
                            >
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={cn(
                                    'p-2 rounded-full focus:outline-none transition-colors',
                                    getThemeClass(
                                      'bg-gray-100 hover:bg-gray-200 border border-gray-300',
                                      'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                                    )
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <MoreVertical
                                    className={cn(
                                      'w-6 h-6',
                                      getThemeClass('text-gray-700', 'text-white')
                                    )}
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className={cn(
                                  'z-[9999] min-w-[180px] p-1',
                                  getThemeClass('bg-white', 'bg-slate-800')
                                )}
                                forceMount
                                data-dropdown
                              >
                                {/* Report button - only show for other users' comments */}
                                {loggedInUser?.userId !== c.userId && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleReportClick(c.commentId);
                                    }}
                                    className={cn(
                                      'flex items-center gap-2 text-sm px-3 py-2 rounded-md cursor-pointer',
                                      getThemeClass(
                                        'text-red-600 hover:bg-red-50',
                                        'text-red-400 hover:bg-red-900/30'
                                      )
                                    )}
                                  >
                                    <Flag className="w-4 h-4" />
                                    <span>{t('eventDetail.reportComment')}</span>
                                  </DropdownMenuItem>
                                )}
                                {/* Edit and Delete - only for comment owner */}
                                {loggedInUser?.userId === c.userId && (
                                  <>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleEdit(c.commentId, c.content);
                                        closeDropdown();
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 text-sm px-3 py-2 rounded-md cursor-pointer',
                                        getThemeClass(
                                          'text-blue-600 hover:bg-blue-50',
                                          'text-blue-400 hover:bg-blue-900/30'
                                        )
                                      )}
                                    >
                                      <span>✏️</span>
                                      <span>{t('edit')}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleDelete(c.commentId);
                                        closeDropdown();
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 text-sm px-3 py-2 rounded-md cursor-pointer',
                                        getThemeClass(
                                          'text-red-600 hover:bg-red-50',
                                          'text-red-400 hover:bg-red-900/30'
                                        )
                                      )}
                                    >
                                      <span>🗑️</span>
                                      <span>{t('delete')}</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {editingCommentId === c.commentId ? (
                          <div className="mt-2">
                            <textarea
                              ref={editTextareaRef}
                              className={cn(
                                'w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition',
                                getThemeClass(
                                  'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                                  'bg-slate-600 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500'
                                )
                              )}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              disabled={posting}
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                              <button
                                className={cn(
                                  'px-4 py-2 rounded-lg font-semibold transition',
                                  getThemeClass(
                                    'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
                                    'bg-blue-600 text-white hover:bg-blue-700'
                                  )
                                )}
                                onClick={() => handleSaveEdit(c.commentId)}
                                disabled={posting || !editContent.trim()}
                              >
                                {t('save')}
                              </button>
                              <button
                                className={cn(
                                  'px-4 py-2 rounded-lg font-semibold transition',
                                  getThemeClass(
                                    'bg-gray-200 text-gray-700 hover:bg-gray-300',
                                    'bg-slate-700 text-white hover:bg-slate-600'
                                  )
                                )}
                                onClick={() => setEditingCommentId(null)}
                                disabled={posting}
                              >
                                {t('cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              'text-sm mt-1',
                              getThemeClass('text-gray-700', 'text-slate-200')
                            )}
                          >
                            {c.content}
                          </p>
                        )}
                      </div>
                      {/* Xác nhận xóa bình luận vĩnh viễn - mockup nhỏ */}
                      {deleteConfirmId === c.commentId && (
                        <div
                          className={cn(
                            'absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg p-4 flex flex-col items-center min-w-[220px]',
                            getThemeClass(
                              'bg-white border border-red-400',
                              'bg-slate-800 border border-red-400'
                            )
                          )}
                        >
                          <p
                            className={cn(
                              'font-semibold mb-3 text-center',
                              getThemeClass('text-red-700', 'text-red-400')
                            )}
                          >
                            {t('confirmDeleteComment')}
                          </p>
                          <div className="flex gap-3">
                            <button
                              className={cn(
                                'px-4 py-1 rounded font-semibold transition',
                                getThemeClass(
                                  'bg-red-600 text-white hover:bg-red-700',
                                  'bg-red-600 text-white hover:bg-red-700'
                                )
                              )}
                              onClick={() => confirmDelete(c.commentId)}
                            >
                              {t('delete')}
                            </button>
                            <button
                              className={cn(
                                'px-4 py-1 rounded font-semibold transition',
                                getThemeClass(
                                  'bg-gray-300 text-gray-800 hover:bg-gray-400',
                                  'bg-slate-600 text-white hover:bg-slate-700'
                                )
                              )}
                              onClick={cancelDelete}
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {sortedComments.length > showCount ? (
                  <div className="flex justify-center mt-2">
                    <button
                      className={cn(
                        'px-4 py-2 rounded-lg font-semibold transition',
                        getThemeClass(
                          'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
                          'bg-purple-700 text-white hover:bg-purple-800'
                        )
                      )}
                      onClick={() => setShowCount((c) => c + 3)}
                    >
                      {t('showMore')}
                    </button>
                  </div>
                ) : null}
                {/* Nút thu gọn khi đã hiện hết comment và tổng số comment > 3 */}
                {sortedComments.length > 3 && showCount >= sortedComments.length && (
                  <div className="flex justify-center mt-2">
                    <button
                      className={cn(
                        'px-4 py-2 rounded-lg font-semibold transition',
                        getThemeClass(
                          'bg-gray-500 text-white hover:bg-gray-600 shadow-md',
                          'bg-slate-700 text-white hover:bg-slate-800'
                        )
                      )}
                      onClick={() => setShowCount(3)}
                    >
                      {t('showLess')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegisterRedirect={handleRegisterRedirect}
      />

      {showRegisterModal && (
        <RegisterModal
          open={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegisterSuccess={handleRegisterSuccess}
          onLoginRedirect={handleLoginRedirect}
        />
      )}
    </div>
  );
}
