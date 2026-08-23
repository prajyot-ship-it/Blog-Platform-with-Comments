import React, { useState, useEffect, useCallback } from 'react';
import { Post, SortOption } from './types';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { PostCard } from './components/PostCard';
import { PostReader } from './components/PostReader';
import { PostEditorModal } from './components/PostEditorModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { 
  BookOpen, 
  Sparkles, 
  PenSquare, 
  TrendingUp, 
  Layers, 
  Tag as TagIcon, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function BlogApp() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'all'>('published');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPosts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
        status: statusFilter,
      });
      setPosts(res.posts);
    } catch {
      toast('Failed to load posts from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTag, searchQuery, sortBy, statusFilter, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Actions
  const handleOpenCreatePost = () => {
    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setPostToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setPostToEdit(post);
    setIsEditorOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPostId === postId) {
        setSelectedPostId(null);
      }
      toast('Article deleted successfully', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to delete article', 'error');
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const likedBy = p.likedBy || [];
          const newLikedBy = res.liked
            ? [...likedBy, user.id]
            : likedBy.filter((id) => id !== user.id);
          return {
            ...p,
            likesCount: res.likesCount,
            likedBy: newLikedBy,
          };
        })
      );
    } catch {
      toast('Failed to like post', 'error');
    }
  };

  const handlePostSaved = (savedPost: Post) => {
    fetchPosts();
    if (selectedPostId === savedPost.id) {
      // Refresh current reader
      setSelectedPostId(savedPost.id);
    }
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setSelectedPostId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (authorId: string) => {
    setProfileUserId(authorId);
  };

  const handleGoHome = () => {
    setSelectedPostId(null);
    setSelectedCategory('All');
    setSelectedTag(null);
    setSearchQuery('');
    setStatusFilter('published');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Top trending tags calculation
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#33332D]">
      
      {/* Top Navigation */}
      <Navbar
        onOpenCreatePost={handleOpenCreatePost}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={(uid) => setProfileUserId(uid)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (selectedPostId) setSelectedPostId(null);
        }}
        onGoHome={handleGoHome}
        onDataReset={() => {
          fetchPosts();
          setSelectedPostId(null);
        }}
        onSelectPost={(postId) => {
          setSelectedPostId(postId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedPostId(null);
          setSelectedTag(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectTag={handleSelectTag}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {selectedPostId ? (
          /* Single Article Reader & Comments View */
          <PostReader
            postId={selectedPostId}
            onBack={() => setSelectedPostId(null)}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onSelectTag={handleSelectTag}
            onSelectAuthor={handleSelectAuthor}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
          />
        ) : (
          /* Feed & Exploration View */
          <div className="space-y-6">
            
            {/* Editorial Spotlight Strip */}
            {!searchQuery && !selectedTag && selectedCategory === 'All' && posts.length > 0 && statusFilter === 'published' && (
              <section id="spotlight-featured-post" className="relative rounded-3xl overflow-hidden bg-[#3A3A2C] text-white border border-[#DCDCD2] shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-[#5A5A40] text-white">
                          Featured Story
                        </span>
                        <span className="text-[#DCDCD2] text-xs font-medium uppercase tracking-wider">{posts[0].category}</span>
                      </div>
                      <h1
                        onClick={() => setSelectedPostId(posts[0].id)}
                        className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium leading-tight cursor-pointer hover:text-[#E5E5DE] transition-colors"
                      >
                        {posts[0].title}
                      </h1>
                      <p className="text-[#DCDCD2] text-sm sm:text-base leading-relaxed line-clamp-3 font-serif italic">
                        {posts[0].summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#5A5A4A]/60">
                      <div className="flex items-center gap-3">
                        <img
                          src={posts[0].author.avatarUrl}
                          alt={posts[0].author.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-[#8C8C7A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{posts[0].author.name}</p>
                          <p className="text-[10px] text-[#DCDCD2]">{posts[0].readTimeMinutes} min read &bull; {posts[0].views} views</p>
                        </div>
                      </div>

                      <button
                        id="read-featured-post-btn"
                        onClick={() => setSelectedPostId(posts[0].id)}
                        className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F5F0] text-[#3A3A2C] text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div 
                    className="lg:col-span-5 h-64 lg:h-auto bg-cover bg-center cursor-pointer relative"
                    style={{ backgroundImage: `url(${posts[0].coverImage})` }}
                    onClick={() => setSelectedPostId(posts[0].id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#3A3A2C] via-[#3A3A2C]/40 to-transparent" />
                  </div>
                </div>
              </section>
            )}

            {/* Filter Bar */}
            <FilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              selectedTag={selectedTag}
              onClearTag={() => setSelectedTag(null)}
              sortBy={sortBy}
              onSortChange={setSortBy}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              totalPosts={posts.length}
            />

            {/* Trending Tags Row */}
            {allTags.length > 0 && !selectedTag && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[#8C8C7A] flex items-center gap-1 font-black uppercase tracking-widest text-[9px] shrink-0">
                  <TrendingUp className="w-3 h-3 text-[#5A5A40]" />
                  <span>Popular Topics:</span>
                </span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    id={`trending-tag-${tag.toLowerCase()}`}
                    onClick={() => handleSelectTag(tag)}
                    className="bg-white hover:bg-[#E5E5DE] text-[#5A5A40] hover:text-[#3A3A2C] border border-[#DCDCD2] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#DCDCD2] border-t-[#5A5A40] rounded-full animate-spin mx-auto" />
                <p className="text-[#8C8C7A] text-xs font-bold uppercase tracking-wider">Fetching articles...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 px-4 text-center bg-white rounded-3xl border border-[#DCDCD2] shadow-2xs space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F0] text-[#5A5A40] border border-[#DCDCD2] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1A1A17]">No articles found</h3>
                  <p className="text-xs text-[#5A5A4A] max-w-xs mx-auto mt-1">
                    Try adjusting your filters, searching for a different keyword, or writing a new article.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    id="clear-all-filters-btn"
                    onClick={handleGoHome}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5A5A40] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] rounded-full transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    id="create-first-post-btn"
                    onClick={handleOpenCreatePost}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#3A3A2C] hover:bg-[#1A1A17] rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <PenSquare className="w-3.5 h-3.5 text-[#E5E5DE]" />
                    <span>Write an Article</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReadPost={(id) => {
                      setSelectedPostId(id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onToggleLike={handleToggleLike}
                    onSelectTag={handleSelectTag}
                    onSelectAuthor={handleSelectAuthor}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#DCDCD2] bg-[#FDFCFB] py-10 text-xs text-[#8C8C7A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#3A3A2C] text-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-[#E5E5DE]" />
            </div>
            <span className="font-serif font-bold text-[#1A1A17] text-sm">Chronicle</span>
            <span className="text-[#DCDCD2]">&bull;</span>
            <span className="text-[#5A5A4A]">Full-Stack Blogging Platform with RESTful API & Discussion System</span>
          </div>

          <div className="flex items-center gap-4 text-[#8C8C7A] text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5A5A40]" /> Authenticated REST API
            </span>
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-[#5A5A40]" /> TypeScript & Express
            </span>
          </div>
        </div>
      </footer>

      {/* Post Editor Modal */}
      <PostEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setPostToEdit(null);
        }}
        onPostSaved={handlePostSaved}
        postToEdit={postToEdit}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Author Profile Modal */}
      <UserProfileModal
        userId={profileUserId}
        isOpen={Boolean(profileUserId)}
        onClose={() => setProfileUserId(null)}
        onSelectPost={(id) => {
          setSelectedPostId(id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BlogApp />
      </AuthProvider>
    </ToastProvider>
  );
}
