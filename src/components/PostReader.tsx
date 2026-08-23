import React, { useState, useEffect } from 'react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from './Toast';
import { CommentSection } from './CommentSection';
import Markdown from 'react-markdown';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Clock, 
  Eye, 
  Calendar, 
  Edit3, 
  Trash2, 
  Tag, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';

interface PostReaderProps {
  postId: string;
  onBack: () => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectAuthor: (authorId: string) => void;
  onOpenAuth: () => void;
}

export const PostReader: React.FC<PostReaderProps> = ({
  postId,
  onBack,
  onEditPost,
  onDeletePost,
  onSelectTag,
  onSelectAuthor,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        api.getPostById(postId),
        api.getComments(postId),
      ]);
      setPost(postRes.post);
      setComments(commentsRes.comments);
    } catch {
      toast('Failed to load article', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostAndComments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [postId]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentScroll = window.scrollY;
        const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [post]);

  const handleToggleLike = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!post) return;

    try {
      const res = await api.togglePostLike(post.id);
      setPost((prev) => {
        if (!prev) return null;
        const likedBy = prev.likedBy || [];
        const newLikedBy = res.liked
          ? [...likedBy, user.id]
          : likedBy.filter((id) => id !== user.id);
        return {
          ...prev,
          likesCount: res.likesCount,
          likedBy: newLikedBy,
        };
      });
    } catch {
      toast('Failed to like post', 'error');
    }
  };

  const handleAddComment = async (content: string, parentId?: string | null) => {
    if (!post) return;
    const res = await api.addComment(post.id, content, parentId);
    setComments((prev) => [...prev, res.comment]);
    setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null));
  };

  const handleEditComment = async (commentId: string, content: string) => {
    const res = await api.updateComment(postId, commentId, content);
    setComments((prev) => prev.map((c) => (c.id === commentId ? res.comment : c)));
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.deleteComment(postId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    setPost((prev) => (prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - 1) } : null));
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const res = await api.toggleCommentLike(postId, commentId);
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const likedBy = c.likedBy || [];
        const newLikedBy = res.liked
          ? [...likedBy, user.id]
          : likedBy.filter((id) => id !== user.id);
        return {
          ...c,
          likesCount: res.likesCount,
          likedBy: newLikedBy,
          reactions: res.reactions || c.reactions,
        };
      })
    );
  };

  const handleToggleCommentReaction = async (commentId: string, emoji: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const res = await api.toggleCommentReaction(postId, commentId, emoji);
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          reactions: res.reactions,
          likesCount: res.likesCount,
          likedBy: res.likedBy,
        };
      })
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-10 h-10 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Loading article and discussion...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Article Not Found</h2>
        <p className="text-zinc-500 text-sm mb-6">The article you are looking for may have been removed or unpublished.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Feed
        </button>
      </div>
    );
  }

  const isOwner = user && (user.id === post.authorId || user.role === 'admin');
  const isLiked = user && post.likedBy?.includes(user.id);
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      {/* Subtle Horizontal Reading Progress Bar Fixed at Top */}
      <div 
        id="reading-progress-track"
        className="fixed top-0 left-0 right-0 z-50 h-[3.5px] bg-[#DCDCD2]/70 backdrop-blur-xs pointer-events-none"
      >
        <div
          id="reading-progress-bar"
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-full bg-[#5A5A40] transition-[width] duration-150 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <motion.article
        id={`post-reader-${post.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20"
      >
        {/* Top Nav & Return Button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              id="reader-back-btn"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#5A5A40] hover:text-[#3A3A2C] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles</span>
            </button>
            
            {scrollProgress > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C7A] bg-[#F5F5F0] border border-[#DCDCD2] px-2.5 py-1 rounded-full hidden sm:inline-block">
                {Math.round(scrollProgress)}% read
              </span>
            )}
          </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              id="reader-edit-btn"
              onClick={() => onEditPost(post)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#3A3A2C] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              id="reader-delete-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this post?')) {
                  onDeletePost(post.id);
                }
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C4A4A] hover:text-[#733535] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Header Info */}
      <header className="space-y-5 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-[#F5F5F0] text-[#5A5A40] border border-[#DCDCD2]">
            {post.category}
          </span>
          {!post.published && (
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#8C8C7A] text-white">
              Draft Mode
            </span>
          )}
          <span className="text-[#8C8C7A] text-xs font-medium flex items-center gap-1 ml-auto">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.views} views</span>
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#1A1A17] leading-[1.15] tracking-tight">
          {post.title}
        </h1>

        <p className="text-lg leading-relaxed text-[#5A5A4A] max-w-3xl font-serif italic border-l-4 border-[#E5E5DE] pl-6 py-1">
          {post.summary}
        </p>

        {/* Author Bio Card */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-5 border-y border-[#DCDCD2]">
          <button
            id={`reader-author-btn-${post.author.id}`}
            onClick={() => onSelectAuthor(post.author.id)}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-[#DCDCD2] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#3A3A2C] group-hover:text-[#5A5A40] transition-colors text-sm sm:text-base">
                  {post.author.name}
                </p>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#8C8C7A] bg-[#F5F5F0] border border-[#DCDCD2] px-1.5 py-0.5 rounded-sm">
                  {post.author.role || 'Contributor'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#8C8C7A] mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#8C8C7A]" />
                  {formattedDate}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8C8C7A]" />
                  {post.readTimeMinutes} min read
                </span>
              </div>
            </div>
          </button>

          {/* Social / Clap Actions */}
          <div className="flex items-center gap-3">
            <button
              id="reader-like-btn"
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isLiked
                  ? 'bg-[#E5E5DE] text-[#8C4A4A] border border-[#C5C5B8] shadow-2xs'
                  : 'bg-[#F5F5F0] hover:bg-[#E5E5DE] text-[#5A5A40] hover:text-[#3A3A2C] border border-[#DCDCD2]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#8C4A4A]' : ''}`} />
              <span>{post.likesCount || 0} Likes</span>
            </button>

            <button
              id="reader-share-btn"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5F5F0] hover:bg-[#E5E5DE] text-[#8C8C7A] hover:text-[#33332D] border border-[#DCDCD2] transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#5A5A40]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Cover Banner */}
      {post.coverImage && (
        <div className="aspect-16/9 sm:aspect-21/9 w-full rounded-3xl overflow-hidden mb-10 shadow-sm border border-[#DCDCD2] bg-[#E5E5DE]">
          <img
            src={post.coverImage}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Markdown Article Content */}
      <div className="prose max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#1A1A17] prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2 prose-p:text-[#5A5A4A] prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-code:bg-[#E5E5DE] prose-code:text-[#3A3A2C] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-pre:bg-[#3A3A2C] prose-pre:text-[#F5F5F0] prose-pre:p-4 prose-pre:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-[#E5E5DE] prose-blockquote:bg-[#FDFCFB] prose-blockquote:p-4 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-[#5A5A4A] prose-blockquote:font-serif">
        <Markdown>{post.content}</Markdown>
      </div>

      {/* Tags Section */}
      <div className="mt-10 pt-6 border-t border-[#DCDCD2] flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-widest mr-2">Tags:</span>
        {post.tags.map((tag) => (
          <button
            key={tag}
            id={`reader-tag-${tag.toLowerCase()}`}
            onClick={() => onSelectTag(tag)}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#33332D] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] px-3 py-1 rounded-sm transition-colors cursor-pointer"
          >
            <Tag className="w-2.5 h-2.5 text-[#8C8C7A]" />
            <span>{tag}</span>
          </button>
        ))}
      </div>

      {/* Threaded Comments Section */}
      <CommentSection
        postId={post.id}
        comments={comments}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onToggleCommentLike={handleToggleCommentLike}
        onToggleCommentReaction={handleToggleCommentReaction}
        onOpenAuth={onOpenAuth}
      />
      </motion.article>
    </>
  );
};
