import { useEffect, useState } from "react";
import instance from "@/services/axios.customize";
import { Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";

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


export default function CommentSection({ eventId }: { eventId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
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
        toast.error("Không thể tải bình luận.");
        setComments([])
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (eventId) {
      fetchComments();
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
      toast.success("Đã gửi bình luận!");
      fetchComments(); 
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Gửi bình luận thất bại.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-8 bg-slate-800/50 p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold text-purple-300 mb-6 border-b border-purple-700 pb-3">
        Bình luận & Thảo luận
      </h3>
      
      {loggedInUser ? (
        <form onSubmit={handlePost} className="flex items-start gap-4 mb-8">
           <img
                src={loggedInUser.avatar || 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/150/94a3b8/ffffff?text=U'; }}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover"
            />
          <div className="flex-1">
            <textarea
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              placeholder={`Bình luận với tư cách ${loggedInUser.fullName}...`}
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
                    <span>{posting ? "Đang gửi..." : "Gửi"}</span>
                </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center text-slate-400 mb-8 p-4 bg-slate-700/50 rounded-lg">
            Vui lòng <a href="/login" className="text-purple-400 hover:underline font-semibold">đăng nhập</a> để bình luận.
        </div>
      )}


      {loading ? (
         <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin w-8 h-8 text-purple-400" />
         </div>
      ) : (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-slate-400 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
          ) : (
            [...comments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(c => (
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
                      <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <p className="text-sm text-slate-200 mt-1">{c.content}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
} 