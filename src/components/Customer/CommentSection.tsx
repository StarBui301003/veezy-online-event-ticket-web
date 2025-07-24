/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import instance from "@/services/axios.customize";
import { Loader2, Send, MoreVertical, Flag } from "lucide-react";
import { toast } from "react-toastify";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
// import ReportModal from './ReportModal';

import { connectCommentHub, onComment } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

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
            return {
                userId: acc.userId,
                fullName: acc.fullName,
                avatar: acc.avatar
            };
        }
        return null;
    } catch {
        return null;
    }
}


export default function CommentSection({ eventId, setReportModal }: { eventId: string, setReportModal: (v: {type: 'comment', id: string}) => void }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [showCount, setShowCount] = useState(3);
  const [showComment, setShowComment] = useState(true);
  const loggedInUser = getLoggedInUser();

  const fetchComments = () => {
    setLoading(true);
    instance.get(`/api/Comment/event/${eventId}`)
      .then(res => {
        const apiData = res.data?.data;
        if (Array.isArray(apiData)) {
          setComments(
            apiData.map((c: unknown) => {
              if (
                typeof c === 'object' && c !== null &&
                'commentId' in c && 'userId' in c && 'content' in c && 'createdAt' in c
              ) {
                const obj = c as Partial<Comment> & { fullName?: string; avatarUrl?: string };
                return {
                  commentId: obj.commentId ?? '',
                  userId: obj.userId ?? '',
                  fullName: obj.fullName || 'Ẩn danh',
                  avatarUrl: obj.avatarUrl || 'https://via.placeholder.com/150/94a3b8/ffffff?text=U',
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
        setComments([])
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (eventId) {
      fetchComments();
      connectCommentHub('http://localhost:5004/commentHub');
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
      await instance.post("/api/Comment", {
        eventId,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success(t('commentSent'));
      fetchComments(); 
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || t('postCommentFailed'));
    } finally {
      setPosting(false);
    }
  };

  // Hiển thị tối đa 3 comment, có nút xem thêm
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visibleComments = sortedComments.slice(0, showCount);

  // Chỉ hiện scroll khi đã bấm "Xem thêm" (tức là showCount > 3 và có nhiều hơn 3 comment)
  const isScrollable = showCount > 3 && sortedComments.length > 3;
  // Tăng chiều cao tối đa để đủ chỗ cho 3 comment và tránh bị đè lên EventChatAssistant
  return (
    <div className={`mt-8 bg-slate-800/50 p-6 rounded-xl shadow-xl max-h-[700px] min-h-[340px] flex flex-col${!showComment ? ' mb-0' : ''}`} style={{ overscrollBehavior: 'contain' }}>
      <button
        onClick={() => setShowComment(v => !v)}
        className={`w-full flex justify-between items-center text-lg font-semibold text-purple-300 border-b border-purple-700 pb-3 focus:outline-none bg-slate-900/60 px-4 py-2 rounded-lg transition-all duration-200 ${showComment ? 'mb-6' : 'mb-0'}`}
        type="button"
      >
        {t('commentDiscussion')}
        <span>{showComment ? '▲' : '▼'}</span>
      </button>
      {showComment && (
        <>
          {/* Khung nhập chat luôn ghim trên đầu */}
          <div className="sticky top-0 z-10 bg-slate-800/50 pb-4">
            {loggedInUser ? (
              <form onSubmit={handlePost} className="flex items-start gap-4 mb-4">
                <img
                  src={loggedInUser.avatar || 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'; }}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder={`${t('sendComment')} ${loggedInUser.fullName}...`}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    disabled={posting}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={posting || !newComment.trim()}
                    >
                      {posting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                      <span>{posting ? t('sending') : t('send')}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center text-slate-400 mb-4 p-4 bg-slate-700/50 rounded-lg">
                {t('loginToComment')} <a href="/login" className="text-purple-400 hover:underline font-semibold">{t('login')}</a> {t('comment')}
              </div>
            )}
          </div>
          {/* Danh sách comment */}
          <div className={`flex-1 space-y-6${isScrollable ? ' overflow-y-auto' : ''}`}>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="animate-spin w-8 h-8 text-purple-400" />
              </div>
            ) : (
              <>
                {visibleComments.length === 0 ? (
                  <div className="text-slate-400 text-center py-4">{t('noCommentsYet')}</div>
                ) : (
                  visibleComments.map(c => (
                    <div key={c.commentId} className="flex items-start gap-4">
                      <img
                        src={c.avatarUrl}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'; }}
                        alt={`${c.fullName}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-purple-300">{c.fullName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("vi-VN")}</p>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 focus:outline-none border border-slate-700">
                                  <MoreVertical className="w-6 h-6 text-white" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} style={{ maxHeight: 300, overflowY: 'auto' }}>
                                <DropdownMenuItem
                                  onSelect={e => {
                                    e.preventDefault();
                                    setReportModal({type: 'comment', id: c.commentId});
                                  }}
                                  className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                                >
                                  <Flag className="w-4 h-4" /> {t('reportComment')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-slate-200 mt-1">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {sortedComments.length > showCount ? (
                  <div className="flex justify-center mt-2">
                    <button
                      className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition"
                      onClick={() => setShowCount(c => c + 3)}
                    >
                      {t('showMore')}
                    </button>
                  </div>
                ) : null}
                {/* Nút thu gọn khi đã hiện hết comment và tổng số comment > 3 */}
                {sortedComments.length > 3 && showCount >= sortedComments.length && (
                  <div className="flex justify-center mt-2">
                    <button
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
                      onClick={() => setShowCount(3)}
                    >
                      {t('collapse') || 'Thu gọn'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}