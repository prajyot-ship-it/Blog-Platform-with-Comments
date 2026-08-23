import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from './Toast';
import { 
  X, 
  BookOpen, 
  Eye, 
  Heart, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  FileText 
} from 'lucide-react';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSelectPost,
  onEditPost,
  onDeletePost,
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [usersRes, postsRes] = await Promise.all([
          api.getUsers(),
          api.getPosts({ authorId: userId, status: 'all' }),
        ]);

        const targetUser = usersRes.users.find((u) => u.id === userId);
        setProfileUser(targetUser || null);
        setUserPosts(postsRes.posts);
      } catch {
        toast('Failed to load user profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userId, isOpen]);

  if (!isOpen || !userId) return null;

  const totalViews = userPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const isSelf = currentUser?.id === userId;

  return (
    <div id="user-profile-modal-overlay" className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#DCDCD2] overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="bg-[#3A3A2C] text-white p-6 relative">
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#DCDCD2] hover:text-white p-1.5 rounded-full hover:bg-[#5A5A4A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {profileUser ? (
            <div className="flex items-start gap-4">
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#DCDCD2] shadow-md shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl font-bold text-white">{profileUser.name}</h3>
                  <span className="text-[9px] bg-[#5A5A40] text-white border border-[#8C8C7A] px-2.5 py-0.5 rounded-sm font-black uppercase tracking-widest">
                    {profileUser.role}
                  </span>
                </div>
                <p className="text-[#DCDCD2] text-xs mt-0.5">@{profileUser.username} &bull; {profileUser.email}</p>
                <p className="text-[#E5E5DE] text-sm mt-2 leading-relaxed font-serif italic">{profileUser.bio}</p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-[#DCDCD2] text-xs font-bold uppercase tracking-wider">Loading profile...</div>
          )}

          {/* Metrics ribbon */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#5A5A4A]/60 text-center">
            <div className="bg-[#5A5A40]/50 rounded-2xl p-2.5 border border-[#5A5A4A]">
              <p className="text-xl font-bold text-white">{userPosts.length}</p>
              <p className="text-[10px] text-[#DCDCD2] uppercase tracking-wider font-bold">Articles</p>
            </div>
            <div className="bg-[#5A5A40]/50 rounded-2xl p-2.5 border border-[#5A5A4A]">
              <p className="text-xl font-bold text-[#FDFCFB]">{totalViews}</p>
              <p className="text-[10px] text-[#DCDCD2] uppercase tracking-wider font-bold">Total Views</p>
            </div>
            <div className="bg-[#5A5A40]/50 rounded-2xl p-2.5 border border-[#5A5A4A]">
              <p className="text-xl font-bold text-[#E5E5DE]">{totalLikes}</p>
              <p className="text-[10px] text-[#DCDCD2] uppercase tracking-wider font-bold">Likes Received</p>
            </div>
          </div>
        </div>

        {/* Authored Posts List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-lg font-bold text-[#1A1A17]">
              Published Articles & Drafts
            </h4>
            <span className="text-xs text-[#8C8C7A] font-bold uppercase tracking-wider">{userPosts.length} articles</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#8C8C7A] text-xs font-bold uppercase tracking-wider">Loading articles...</div>
          ) : userPosts.length === 0 ? (
            <div className="py-12 text-center bg-[#F5F5F0] rounded-2xl border border-dashed border-[#DCDCD2]">
              <BookOpen className="w-8 h-8 text-[#8C8C7A] mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A5A40]">No articles created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  id={`profile-post-${post.id}`}
                  onClick={() => {
                    onSelectPost(post.id);
                    onClose();
                  }}
                  className="group p-4 rounded-2xl border border-[#DCDCD2] hover:border-[#8C8C7A] hover:bg-[#F5F5F0] transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#5A5A40] bg-[#F5F5F0] border border-[#DCDCD2] px-2 py-0.5 rounded-sm">
                        {post.category}
                      </span>
                      {!post.published && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-[#5A5A40] text-white px-2 py-0.5 rounded-sm">
                          Draft
                        </span>
                      )}
                    </div>
                    <h5 className="font-serif font-bold text-[#1A1A17] text-sm sm:text-base group-hover:text-[#5A5A40] transition-colors line-clamp-1">
                      {post.title}
                    </h5>
                    <div className="flex items-center gap-3 text-[11px] text-[#8C8C7A]">
                      <span>{post.readTimeMinutes} min read</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-[#5A5A40]" /> {post.likesCount}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-[#8C8C7A]" /> {post.views}
                      </span>
                    </div>
                  </div>

                  {isSelf && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`profile-edit-post-${post.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPost(post);
                          onClose();
                        }}
                        className="p-1.5 text-[#8C8C7A] hover:text-[#1A1A17] hover:bg-[#E5E5DE] rounded-full cursor-pointer transition-colors"
                        title="Edit post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        id={`profile-delete-post-${post.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this article?')) {
                            onDeletePost(post.id);
                            setUserPosts((prev) => prev.filter((p) => p.id !== post.id));
                          }
                        }}
                        className="p-1.5 text-[#8C8C7A] hover:text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
