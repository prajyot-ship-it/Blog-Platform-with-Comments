import React from 'react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageSquare, Clock, Eye, Edit3, Trash2, Tag, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface PostCardProps {
  post: Post;
  onReadPost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectAuthor: (authorId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onReadPost,
  onEditPost,
  onDeletePost,
  onToggleLike,
  onSelectTag,
  onSelectAuthor,
}) => {
  const { user } = useAuth();
  const isOwner = user && (user.id === post.authorId || user.role === 'admin');
  const isLiked = user && post.likedBy?.includes(user.id);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.article
      id={`post-card-${post.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-2xl border border-[#DCDCD2] shadow-2xs hover:shadow-md hover:border-[#C5C5B8] transition-all overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Cover Image & Category Header */}
        <div className="relative aspect-16/9 w-full bg-[#E5E5DE] overflow-hidden cursor-pointer" onClick={() => onReadPost(post.id)}>
          <img
            src={post.coverImage}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-[#FDFCFB]/95 text-[#5A5A40] backdrop-blur-md shadow-xs border border-[#DCDCD2]">
              {post.category}
            </span>
            {!post.published && (
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#8C8C7A] text-white shadow-xs">
                Draft
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#3A3A2C]/85 text-[#F5F5F0] backdrop-blur-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#E5E5DE]" />
            <span>{post.readTimeMinutes} min read</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-3">
          
          {/* Author Metadata */}
          <div className="flex items-center justify-between gap-2">
            <button
              id={`post-author-btn-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAuthor(post.authorId);
              }}
              className="flex items-center gap-2.5 text-left group/author cursor-pointer"
            >
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-[#DCDCD2] shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-[#3A3A2C] group-hover/author:text-[#5A5A40] transition-colors leading-none">
                  {post.author.name}
                </p>
                <p className="text-[10px] text-[#8C8C7A] mt-0.5">{formattedDate}</p>
              </div>
            </button>

            {/* Author Quick Action Controls */}
            {isOwner && (
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  id={`post-edit-btn-${post.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPost(post);
                  }}
                  className="p-1.5 text-[#8C8C7A] hover:text-[#3A3A2C] hover:bg-[#F5F5F0] rounded-lg transition-colors cursor-pointer"
                  title="Edit post"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id={`post-delete-btn-${post.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this post?')) {
                      onDeletePost(post.id);
                    }
                  }}
                  className="p-1.5 text-[#8C8C7A] hover:text-[#8C4A4A] hover:bg-[#F5F5F0] rounded-lg transition-colors cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h2
            id={`post-title-${post.id}`}
            onClick={() => onReadPost(post.id)}
            className="font-serif text-lg sm:text-xl font-bold text-[#1A1A17] group-hover:text-[#5A5A40] leading-snug cursor-pointer line-clamp-2 transition-colors"
          >
            {post.title}
          </h2>

          {/* Summary Excerpt */}
          <p className="text-[#5A5A4A] text-sm leading-relaxed line-clamp-2">
            {post.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                id={`post-${post.id}-tag-${tag.toLowerCase()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#33332D] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5 text-[#8C8C7A]" />
                <span>{tag}</span>
              </button>
            ))}
            {post.tags.length > 3 && (
              <span className="text-[10px] font-bold text-[#8C8C7A] self-center">
                +{post.tags.length - 3}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Footer Metrics */}
      <div className="px-5 sm:px-6 py-3.5 bg-[#FDFCFB] border-t border-[#DCDCD2] flex items-center justify-between text-xs text-[#8C8C7A]">
        <div className="flex items-center gap-4">
          
          {/* Like Button */}
          <button
            id={`post-like-btn-${post.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(post.id);
            }}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked ? 'text-[#8C4A4A] font-bold' : 'text-[#8C8C7A] hover:text-[#8C4A4A]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#8C4A4A]' : ''}`} />
            <span className="text-[11px] font-semibold">{post.likesCount || 0}</span>
          </button>

          {/* Comment Count */}
          <button
            id={`post-comments-count-btn-${post.id}`}
            onClick={() => onReadPost(post.id)}
            className="flex items-center gap-1.5 text-[#8C8C7A] hover:text-[#33332D] transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{post.commentsCount || 0}</span>
          </button>

          {/* Views */}
          <div className="flex items-center gap-1 text-[#8C8C7A]">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{post.views || 0}</span>
          </div>

        </div>

        {/* Read More Link */}
        <button
          id={`post-read-more-btn-${post.id}`}
          onClick={() => onReadPost(post.id)}
          className="font-bold text-[11px] uppercase tracking-wider text-[#5A5A40] hover:text-[#3A3A2C] flex items-center gap-1.5 cursor-pointer"
        >
          <span>Read Article</span>
          <BookOpen className="w-3 h-3" />
        </button>
      </div>
    </motion.article>
  );
};
