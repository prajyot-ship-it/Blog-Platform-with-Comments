import React, { useState, useEffect, useRef } from 'react';
import { Comment, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Heart, 
  ThumbsUp,
  SmilePlus,
  Reply, 
  Edit3, 
  Trash2, 
  Send, 
  CornerDownRight, 
  Check, 
  X,
  Lock
} from 'lucide-react';
import { useToast } from './Toast';

export const REACTION_OPTIONS = [
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
];

const KNOWN_USER_NAMES: Record<string, string> = {
  user_alex: 'Alex Rivera',
  user_maya: 'Maya Chen',
  user_david: 'David Kim',
  user_prajyot: 'Prajyot',
};

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string, parentId?: string | null) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onToggleCommentLike: (commentId: string) => Promise<void>;
  onToggleCommentReaction?: (commentId: string, emoji: string) => Promise<void>;
  onOpenAuth: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleCommentLike,
  onToggleCommentReaction,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activePickerCommentId, setActivePickerCommentId] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close reaction picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setActivePickerCommentId(null);
      }
    };
    if (activePickerCommentId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePickerCommentId]);

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  const handlePostMainComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(newCommentText.trim(), null);
      setNewCommentText('');
      toast('Comment posted successfully', 'success');
    } catch {
      toast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(replyText.trim(), parentId);
      setReplyText('');
      setReplyingToId(null);
      toast('Reply posted', 'success');
    } catch {
      toast('Failed to post reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await onEditComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
      toast('Comment updated', 'success');
    } catch {
      toast('Failed to update comment', 'error');
    }
  };

  const handleReactionClick = async (commentId: string, emoji: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActivePickerCommentId(null);
    if (onToggleCommentReaction) {
      await onToggleCommentReaction(commentId, emoji);
    } else {
      await onToggleCommentLike(commentId);
    }
  };

  // Generate readable tooltip text for user reactions
  const getReactionTooltip = (emoji: string, userIds: string[]) => {
    if (!userIds || userIds.length === 0) return '';
    const names: string[] = [];
    let hasYou = false;

    userIds.forEach((uid) => {
      if (user && uid === user.id) {
        hasYou = true;
      } else {
        const foundAuthor = comments.find((c) => c.authorId === uid)?.author.name;
        names.push(KNOWN_USER_NAMES[uid] || foundAuthor || 'A reader');
      }
    });

    if (hasYou) {
      names.unshift('You');
    }

    if (names.length === 1) return `${names[0]} reacted with ${emoji}`;
    if (names.length === 2) return `${names[0]} and ${names[1]} reacted with ${emoji}`;
    return `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length > 3 ? 's' : ''} reacted with ${emoji}`;
  };

  // Group top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  // Render reaction buttons and pills for a comment
  const renderReactionControls = (targetComment: Comment, isNested = false) => {
    const reactions = targetComment.reactions || {};
    const reactionEntries = Object.entries(reactions).filter(([_, uids]) => uids && uids.length > 0);

    // If no explicit reactions dictionary yet but likesCount > 0, fallback to thumbs up
    if (reactionEntries.length === 0 && targetComment.likesCount > 0) {
      reactionEntries.push(['👍', targetComment.likedBy || []]);
    }

    const isPickerOpen = activePickerCommentId === targetComment.id;
    const isThumbsLiked = (targetComment.reactions?.['👍']?.includes(user?.id || '')) ||
      (!targetComment.reactions && targetComment.likedBy?.includes(user?.id || ''));

    return (
      <div className="relative flex flex-wrap items-center gap-1.5 pt-1.5">
        {/* Quick Thumbs Up Button */}
        <button
          id={`quick-like-${targetComment.id}`}
          onClick={() => handleReactionClick(targetComment.id, '👍')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer border ${
            isThumbsLiked
              ? 'bg-[#EBEBE5] border-[#5A5A40] text-[#1A1A17] font-semibold shadow-2xs'
              : 'bg-white border-[#DCDCD2] text-[#6B6B58] hover:text-[#1A1A17] hover:border-[#8C8C7A] hover:bg-[#F9F9F6]'
          }`}
          title={isThumbsLiked ? 'Remove thumbs up' : 'Like / Thumbs up'}
        >
          <ThumbsUp className={`w-3 h-3 ${isThumbsLiked ? 'fill-[#5A5A40] text-[#5A5A40]' : ''}`} />
          <span className="text-[11px]">
            {isThumbsLiked ? 'Liked' : 'Like'}
          </span>
        </button>

        {/* Reaction Pills for each active emoji */}
        {reactionEntries.map(([emoji, uids]) => {
          const userReacted = user && uids.includes(user.id);
          const tooltip = getReactionTooltip(emoji, uids);

          return (
            <button
              key={`${targetComment.id}-reaction-${emoji}`}
              id={`reaction-pill-${targetComment.id}-${emoji}`}
              onClick={() => handleReactionClick(targetComment.id, emoji)}
              title={tooltip}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-all cursor-pointer border ${
                userReacted
                  ? 'bg-[#EAEAE2] border-[#8C8C7A] text-[#1A1A17] font-bold shadow-2xs scale-102'
                  : 'bg-white/90 border-[#DCDCD2] text-[#5A5A40] hover:border-[#8C8C7A] hover:bg-white'
              }`}
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span className="text-[11px] font-semibold text-[#3A3A2C]">{uids.length}</span>
            </button>
          );
        })}

        {/* Add Reaction Trigger Button */}
        <div className="relative inline-block">
          <button
            id={`add-reaction-btn-${targetComment.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                onOpenAuth();
                return;
              }
              setActivePickerCommentId(isPickerOpen ? null : targetComment.id);
            }}
            className={`inline-flex items-center justify-center p-1.5 rounded-full text-[#8C8C7A] hover:text-[#1A1A17] hover:bg-[#E5E5DE] transition-colors cursor-pointer border ${
              isPickerOpen ? 'bg-[#E5E5DE] border-[#8C8C7A] text-[#1A1A17]' : 'border-transparent'
            }`}
            title="Add reaction"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>

          {/* Floating Emoji Picker Popover */}
          {isPickerOpen && (
            <div
              ref={pickerRef}
              id={`reaction-picker-${targetComment.id}`}
              className="absolute bottom-full left-0 mb-2 z-30 bg-white rounded-full p-1.5 shadow-lg border border-[#DCDCD2] flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150"
            >
              {REACTION_OPTIONS.map((option) => {
                const isSelected = user && targetComment.reactions?.[option.emoji]?.includes(user.id);
                return (
                  <button
                    key={option.emoji}
                    id={`picker-option-${targetComment.id}-${option.emoji}`}
                    onClick={() => handleReactionClick(targetComment.id, option.emoji)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-base transition-transform hover:scale-125 cursor-pointer ${
                      isSelected ? 'bg-[#E5E5DE]' : 'hover:bg-[#F5F5F0]'
                    }`}
                    title={option.label}
                  >
                    <span>{option.emoji}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply Trigger for Top-level or Nested */}
        <button
          id={`reply-comment-btn-${targetComment.id}`}
          onClick={() => {
            if (!user) {
              onOpenAuth();
              return;
            }
            setReplyingToId(replyingToId === targetComment.id ? null : targetComment.id);
            setReplyText('');
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#1A1A17] ml-auto sm:ml-2 px-2 py-1 rounded-md hover:bg-[#E5E5DE]/50 transition-colors cursor-pointer"
        >
          <Reply className="w-3 h-3" />
          <span>Reply</span>
        </button>
      </div>
    );
  };

  return (
    <section id="comments-section" className="mt-12 pt-10 border-t border-[#DCDCD2]">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] border border-[#DCDCD2] flex items-center justify-center text-[#5A5A40]">
            <MessageSquare className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#1A1A17]">
            Discussion ({comments.length})
          </h3>
        </div>
      </div>

      {/* Main Comment Input Box */}
      {user ? (
        <form onSubmit={handlePostMainComment} className="mb-10 bg-[#FDFCFB] p-4 sm:p-5 rounded-2xl border border-[#DCDCD2] shadow-2xs">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-[#DCDCD2] shrink-0"
            />
            <div>
              <p className="text-xs font-bold text-[#3A3A2C]">{user.name}</p>
              <p className="text-[11px] text-[#8C8C7A]">Share your thoughts, perspectives, or reflections...</p>
            </div>
          </div>
          <textarea
            id="main-comment-textarea"
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a constructive response or question..."
            className="w-full bg-white text-[#1A1A17] text-sm rounded-xl p-3.5 border border-[#DCDCD2] focus:border-[#8C8C7A] focus:ring-2 focus:ring-[#E5E5DE] outline-hidden transition-all resize-y placeholder:text-[#8C8C7A]"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-[#8C8C7A]">Markdown formatting supported</span>
            <button
              id="submit-main-comment-btn"
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="inline-flex items-center gap-2 bg-[#3A3A2C] hover:bg-[#1A1A17] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 rounded-2xl bg-[#F5F5F0] border border-[#DCDCD2] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E5E5DE] text-[#5A5A40] mx-auto flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1A1A17]">Join the conversation</h4>
            <p className="text-xs text-[#5A5A4A] max-w-sm mx-auto mt-1">
              Sign in with one of our demo profiles to post reflections and engage with fellow readers.
            </p>
          </div>
          <button
            id="comment-login-trigger-btn"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 bg-[#3A3A2C] hover:bg-[#1A1A17] text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors cursor-pointer"
          >
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#FDFCFB] border border-[#DCDCD2]">
            <MessageSquare className="w-8 h-8 text-[#8C8C7A] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#3A3A2C]">No reflections yet</p>
            <p className="text-xs text-[#8C8C7A] mt-1">Be the first to share your thoughts on this story.</p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isAuthor = user?.id === comment.authorId;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                id={`comment-thread-${comment.id}`}
                className="bg-white rounded-2xl p-5 border border-[#DCDCD2] shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={comment.author.avatarUrl}
                      alt={comment.author.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-[#DCDCD2]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1A1A17]">{comment.author.name}</span>
                        {comment.author.role === 'author' && (
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-[#F5F5F0] text-[#5A5A40] border border-[#DCDCD2] px-1.5 py-0.2 rounded-sm">
                            Author
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8C8C7A]">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                  </div>

                  {/* Comment Owner Controls */}
                  {isAuthor && (
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-comment-${comment.id}`}
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.content);
                        }}
                        className="p-1.5 text-[#8C8C7A] hover:text-[#3A3A2C] hover:bg-[#F5F5F0] rounded-md transition-colors cursor-pointer"
                        title="Edit comment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-comment-${comment.id}`}
                        onClick={() => {
                          if (window.confirm('Delete this comment?')) {
                            onDeleteComment(comment.id);
                          }
                        }}
                        className="p-1.5 text-[#8C8C7A] hover:text-[#8C4A4A] hover:bg-[#F5F5F0] rounded-md transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      id={`edit-textarea-${comment.id}`}
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#F5F5F0] text-[#1A1A17] text-sm rounded-lg p-2.5 border border-[#DCDCD2] focus:outline-hidden"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        id={`cancel-edit-${comment.id}`}
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs text-[#8C8C7A] hover:text-[#3A3A2C] cursor-pointer flex items-center gap-1 font-bold"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        id={`save-edit-${comment.id}`}
                        onClick={() => handleSaveEdit(comment.id)}
                        className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#3A3A2C] text-white rounded-full hover:bg-[#1A1A17] cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#5A5A4A] text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                {/* Action Bar with Reactions & Reply */}
                {renderReactionControls(comment, false)}

                {/* Reply Form */}
                {replyingToId === comment.id && (
                  <div className="mt-3 pl-4 border-l-2 border-[#5A5A40] bg-[#F5F5F0] p-3 rounded-r-xl space-y-2">
                    <p className="text-[11px] font-bold text-[#5A5A40]">Replying to @{comment.author.username}</p>
                    <textarea
                      id={`reply-textarea-${comment.id}`}
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full bg-white text-[#1A1A17] text-xs rounded-lg p-2.5 border border-[#DCDCD2] focus:outline-hidden"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`cancel-reply-${comment.id}`}
                        onClick={() => setReplyingToId(null)}
                        className="px-2.5 py-1 text-xs text-[#8C8C7A] hover:text-[#3A3A2C] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id={`submit-reply-${comment.id}`}
                        onClick={() => handlePostReply(comment.id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-3 py-1 bg-[#3A3A2C] text-white text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-[#1A1A17] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#DCDCD2] pl-4 sm:pl-6 space-y-3.5">
                    {replies.map((reply) => {
                      const isReplyAuthor = user?.id === reply.authorId;
                      const isReplyEditing = editingId === reply.id;

                      return (
                        <div
                          key={reply.id}
                          id={`reply-item-${reply.id}`}
                          className="bg-[#F5F5F0]/80 p-3.5 rounded-xl border border-[#DCDCD2] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <CornerDownRight className="w-3 h-3 text-[#8C8C7A] shrink-0" />
                              <img
                                src={reply.author.avatarUrl}
                                alt={reply.author.name}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover border border-[#DCDCD2]"
                              />
                              <div>
                                <span className="text-xs font-bold text-[#1A1A17]">{reply.author.name}</span>
                                <span className="text-[10px] text-[#8C8C7A] ml-2">{formatTimeAgo(reply.createdAt)}</span>
                              </div>
                            </div>

                            {isReplyAuthor && (
                              <div className="flex items-center gap-1">
                                <button
                                  id={`edit-reply-${reply.id}`}
                                  onClick={() => {
                                    setEditingId(reply.id);
                                    setEditText(reply.content);
                                  }}
                                  className="p-1 text-[#8C8C7A] hover:text-[#3A3A2C] rounded-md cursor-pointer"
                                  title="Edit reply"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  id={`delete-reply-${reply.id}`}
                                  onClick={() => {
                                    if (window.confirm('Delete this reply?')) {
                                      onDeleteComment(reply.id);
                                    }
                                  }}
                                  className="p-1 text-[#8C8C7A] hover:text-[#8C4A4A] rounded-md cursor-pointer"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isReplyEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                id={`edit-reply-textarea-${reply.id}`}
                                rows={2}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-white text-[#1A1A17] text-xs rounded-lg p-2 border border-[#DCDCD2] focus:outline-hidden"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  id={`cancel-edit-reply-${reply.id}`}
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 text-xs text-[#8C8C7A] cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  id={`save-edit-reply-${reply.id}`}
                                  onClick={() => handleSaveEdit(reply.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#3A3A2C] text-white rounded-full cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[#5A5A4A] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-5">
                              {reply.content}
                            </p>
                          )}

                          {/* Reaction controls for nested replies */}
                          <div className="pl-5">
                            {renderReactionControls(reply, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
