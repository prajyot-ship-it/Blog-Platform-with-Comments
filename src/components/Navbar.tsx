import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  PenSquare, 
  Search, 
  User as UserIcon, 
  LogOut, 
  RotateCcw, 
  UserCheck, 
  Sparkles,
  Layers,
  ChevronDown,
  Clock,
  X,
  Tag,
  ArrowRight,
  FileText,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../services/api';
import { Post, User } from '../types';

interface NavbarProps {
  onOpenCreatePost: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenProfile: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoHome: () => void;
  onDataReset: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectCategory?: (category: string) => void;
  onSelectTag?: (tag: string) => void;
}

const DEFAULT_POPULAR_TOPICS = [
  'Architecture',
  'Engineering',
  'Design',
  'Product',
  'Tutorials',
];

const DEFAULT_POPULAR_TAGS = [
  'system-design',
  'microservices',
  'react',
  'typescript',
  'performance',
  'database',
  'kubernetes'
];

const STORAGE_KEY = 'chronicle_recent_searches';

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreatePost,
  onOpenAuth,
  onOpenProfile,
  searchQuery,
  onSearchChange,
  onGoHome,
  onDataReset,
  onSelectPost,
  onSelectCategory,
  onSelectTag,
}) => {
  const { user, logout, switchUser, availableUsers } = useAuth();
  const { toast } = useToast();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Cached data for instant suggestions
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['Distributed Systems', 'Architecture', 'React 19'];
    } catch {
      return ['Distributed Systems', 'Architecture', 'React 19'];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch available posts for instant real-time suggestions
  useEffect(() => {
    let isMounted = true;
    const loadSuggestionData = async () => {
      try {
        const res = await api.getPosts({ status: 'published' });
        if (isMounted) {
          setAllPosts(res.posts || []);
        }
      } catch {
        // Fallback silently if offline or initial load
      }
    };
    loadSuggestionData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const removeRecentSearch = (term: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const clearAllRecentSearches = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDesktop = searchContainerRef.current?.contains(target);
      const clickedInsideMobile = mobileSearchContainerRef.current?.contains(target);
      
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real-time suggestions calculations
  const queryLower = searchQuery.trim().toLowerCase();

  const matchingArticles = useMemo(() => {
    if (!queryLower) return [];
    return allPosts.filter((post) => 
      post.title.toLowerCase().includes(queryLower) ||
      post.summary?.toLowerCase().includes(queryLower) ||
      post.category?.toLowerCase().includes(queryLower) ||
      post.author?.name?.toLowerCase().includes(queryLower) ||
      post.tags?.some((t) => t.toLowerCase().includes(queryLower))
    ).slice(0, 4);
  }, [allPosts, queryLower]);

  const matchingCategories = useMemo(() => {
    if (!queryLower) return [];
    const allCategories = Array.from(new Set([
      ...DEFAULT_POPULAR_TOPICS,
      ...allPosts.map((p) => p.category).filter(Boolean)
    ]));
    return allCategories.filter((c) => c.toLowerCase().includes(queryLower)).slice(0, 3);
  }, [allPosts, queryLower]);

  const matchingTags = useMemo(() => {
    if (!queryLower) return [];
    const allTags = Array.from(new Set([
      ...DEFAULT_POPULAR_TAGS,
      ...allPosts.flatMap((p) => p.tags || [])
    ]));
    const cleanQuery = queryLower.startsWith('#') ? queryLower.slice(1) : queryLower;
    return allTags.filter((t) => t.toLowerCase().includes(cleanQuery)).slice(0, 4);
  }, [allPosts, queryLower]);

  const matchingAuthors = useMemo(() => {
    if (!queryLower) return [];
    const authorsMap = new Map<string, { id: string; name: string; username: string; avatarUrl: string; role?: string }>();
    
    availableUsers.forEach((u) => {
      if (u.name.toLowerCase().includes(queryLower) || u.username.toLowerCase().includes(queryLower)) {
        authorsMap.set(u.id, u);
      }
    });

    allPosts.forEach((p) => {
      if (p.author && (p.author.name.toLowerCase().includes(queryLower) || p.author.username.toLowerCase().includes(queryLower))) {
        if (!authorsMap.has(p.author.id)) {
          authorsMap.set(p.author.id, {
            id: p.author.id,
            name: p.author.name,
            username: p.author.username,
            avatarUrl: p.author.avatarUrl,
            role: p.author.role,
          });
        }
      }
    });

    return Array.from(authorsMap.values()).slice(0, 3);
  }, [availableUsers, allPosts, queryLower]);

  const matchingRecentSearches = useMemo(() => {
    if (!queryLower) return recentSearches;
    return recentSearches.filter((s) => s.toLowerCase().includes(queryLower));
  }, [recentSearches, queryLower]);

  const hasSuggestions = 
    matchingArticles.length > 0 || 
    matchingCategories.length > 0 || 
    matchingTags.length > 0 || 
    matchingAuthors.length > 0 ||
    matchingRecentSearches.length > 0;

  // Handlers for suggestion selection
  const handleSelectRecent = (term: string) => {
    onSearchChange(term);
    saveRecentSearch(term);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const handleSelectArticle = (post: Post) => {
    saveRecentSearch(post.title);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    if (onSelectPost) {
      onSelectPost(post.id);
    } else {
      onSearchChange(post.title);
    }
  };

  const handleSelectCategoryAction = (cat: string) => {
    saveRecentSearch(cat);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      onSearchChange(cat);
    }
  };

  const handleSelectTagAction = (tag: string) => {
    saveRecentSearch(`#${tag}`);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    if (onSelectTag) {
      onSelectTag(tag);
    } else {
      onSearchChange(`#${tag}`);
    }
  };

  const handleSelectAuthorAction = (authorId: string, authorName: string) => {
    saveRecentSearch(authorName);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    onOpenProfile(authorId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setMobileSearchOpen(false);
    } else if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
      }
      setIsSearchFocused(false);
      setMobileSearchOpen(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetDemoData();
      toast('Demo database reset to default articles and comments', 'success');
      onDataReset();
      setShowUserMenu(false);
    } catch {
      toast('Failed to reset demo database', 'error');
    }
  };

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-[#DCDCD2] shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            id="brand-logo-btn"
            onClick={onGoHome}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shadow-xs group-hover:bg-[#4A4A35] transition-colors">
              <BookOpen className="w-4 h-4 text-[#F5F5F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black italic tracking-tighter text-2xl text-[#3A3A2C]">Chronicle.</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm bg-[#F5F5F0] text-[#5A5A40] border border-[#DCDCD2]">
                  Journal
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#8C8C7A] font-semibold hidden sm:block">Architecture, Design & Engineering</p>
            </div>
          </button>
        </div>

        {/* Desktop Global Search Bar with Real-Time Suggestions */}
        <div ref={searchContainerRef} className="flex-1 max-w-lg mx-2 hidden md:block relative">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8C7A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="global-search-input"
                type="text"
                placeholder="Search perspectives, topics, authors..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="w-full bg-[#F5F5F0] hover:bg-[#E5E5DE]/50 focus:bg-white text-[#33332D] text-xs sm:text-sm rounded-full pl-10 pr-10 py-2 border border-[#DCDCD2] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/15 outline-hidden transition-all placeholder:text-[#8C8C7A]"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="clear-search-btn"
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8C8C7A] hover:text-[#33332D] bg-[#E5E5DE] hover:bg-[#DCDCD2] rounded-full p-1 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop Search Suggestions & Recent Searches Dropdown */}
          {isSearchFocused && (
            <div
              id="search-suggestions-dropdown"
              className="absolute left-0 right-0 mt-2 bg-[#FDFCFB] rounded-2xl shadow-2xl border border-[#DCDCD2] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] overflow-y-auto"
            >
              {/* Empty Query: Show Recent Searches & Trending Topics */}
              {!queryLower ? (
                <div className="space-y-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#5A5A40]" />
                          <span>Recent Searches</span>
                        </span>
                        <button
                          type="button"
                          id="clear-all-recent-searches-btn"
                          onClick={clearAllRecentSearches}
                          className="text-[10px] font-bold text-[#8C8C7A] hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="mt-1">
                        {recentSearches.map((term, index) => (
                          <div
                            key={`recent-${index}-${term}`}
                            id={`recent-search-item-${index}`}
                            onClick={() => handleSelectRecent(term)}
                            className="group px-4 py-2 flex items-center justify-between hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 text-xs text-[#33332D] group-hover:text-[#1A1A17] truncate">
                              <Clock className="w-3.5 h-3.5 text-[#8C8C7A] shrink-0" />
                              <span className="truncate font-medium">{term}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(term, e)}
                              className="text-[#8C8C7A] hover:text-rose-600 p-1 rounded-full hover:bg-[#E5E5DE] transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                              title="Remove search"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Topics */}
                  <div className="px-4 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3 h-3 text-[#5A5A40]" />
                      <span>Explore Topics</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_POPULAR_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          id={`suggested-topic-${topic.toLowerCase()}`}
                          onClick={() => handleSelectCategoryAction(topic)}
                          className="px-3 py-1 bg-[#F5F5F0] hover:bg-[#E5E5DE] text-[#5A5A40] text-[10px] font-bold uppercase tracking-wider rounded-sm border border-[#DCDCD2] transition-colors cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div className="px-4 pt-1 border-t border-[#DCDCD2]/60">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5 mb-2">
                      <Tag className="w-3 h-3 text-[#5A5A40]" />
                      <span>Popular Tags</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_POPULAR_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          id={`suggested-tag-${tag}`}
                          onClick={() => handleSelectTagAction(tag)}
                          className="px-2.5 py-1 bg-[#FDFCFB] hover:bg-[#F5F5F0] text-[#5A5A4A] text-xs rounded-full border border-[#DCDCD2] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="text-[#8C8C7A]">#</span>
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Query: Show Matching Suggestions */
                <div className="space-y-3">
                  {/* Matching Recent Searches */}
                  {matchingRecentSearches.length > 0 && (
                    <div className="border-b border-[#DCDCD2]/70 pb-2">
                      <div className="px-4 py-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#5A5A40]" />
                          <span>Recent Match</span>
                        </span>
                      </div>
                      {matchingRecentSearches.slice(0, 2).map((term, idx) => (
                        <div
                          key={`match-recent-${idx}`}
                          onClick={() => handleSelectRecent(term)}
                          className="px-4 py-1.5 flex items-center justify-between hover:bg-[#F5F5F0] transition-colors cursor-pointer text-xs"
                        >
                          <span className="font-semibold text-[#3A3A2C]">{term}</span>
                          <span className="text-[10px] text-[#8C8C7A] uppercase font-bold">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Articles */}
                  {matchingArticles.length > 0 && (
                    <div className="border-b border-[#DCDCD2]/70 pb-2">
                      <div className="px-4 py-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-[#5A5A40]" />
                          <span>Articles</span>
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {matchingArticles.map((post) => (
                          <div
                            key={post.id}
                            id={`suggestion-article-${post.id}`}
                            onClick={() => handleSelectArticle(post)}
                            className="px-4 py-2 hover:bg-[#F5F5F0] transition-colors cursor-pointer group flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#5A5A40] bg-[#F5F5F0] border border-[#DCDCD2] px-1.5 py-0.5 rounded-xs">
                                  {post.category}
                                </span>
                                <span className="text-[10px] text-[#8C8C7A]">by {post.author.name}</span>
                              </div>
                              <p className="text-xs font-serif font-bold text-[#1A1A17] group-hover:text-[#5A5A40] transition-colors line-clamp-1">
                                {post.title}
                              </p>
                              {post.summary && (
                                <p className="text-[11px] text-[#8C8C7A] line-clamp-1 mt-0.5">
                                  {post.summary}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8C8C7A] shrink-0 font-medium pt-1">
                              {post.readTimeMinutes}m read
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Categories & Tags */}
                  {(matchingCategories.length > 0 || matchingTags.length > 0) && (
                    <div className="px-4 border-b border-[#DCDCD2]/70 pb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5 mb-1.5">
                        <Layers className="w-3 h-3 text-[#5A5A40]" />
                        <span>Categories & Tags</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleSelectCategoryAction(cat)}
                            className="px-3 py-1 bg-[#F5F5F0] hover:bg-[#E5E5DE] text-[#5A5A40] text-[10px] font-bold uppercase tracking-wider rounded-sm border border-[#DCDCD2] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-[#5A5A40]" />
                            <span>{cat}</span>
                          </button>
                        ))}
                        {matchingTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleSelectTagAction(tag)}
                            className="px-2.5 py-1 bg-[#FDFCFB] hover:bg-[#F5F5F0] text-[#5A5A4A] text-xs rounded-full border border-[#DCDCD2] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="text-[#8C8C7A]">#</span>
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Authors */}
                  {matchingAuthors.length > 0 && (
                    <div className="px-4 border-b border-[#DCDCD2]/70 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] flex items-center gap-1.5 mb-1.5">
                        <UserIcon className="w-3 h-3 text-[#5A5A40]" />
                        <span>Authors</span>
                      </span>
                      <div className="space-y-1">
                        {matchingAuthors.map((author) => (
                          <div
                            key={author.id}
                            onClick={() => handleSelectAuthorAction(author.id, author.name)}
                            className="px-2 py-1.5 rounded-xl hover:bg-[#F5F5F0] transition-colors cursor-pointer flex items-center gap-2.5"
                          >
                            <img
                              src={author.avatarUrl}
                              alt={author.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover border border-[#DCDCD2]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1A1A17] truncate">{author.name}</p>
                              <p className="text-[10px] text-[#8C8C7A] truncate">@{author.username}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#5A5A40] bg-[#F5F5F0] border border-[#DCDCD2] px-1.5 py-0.5 rounded-xs">
                              {author.role || 'Author'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Direct Suggestions Feedback */}
                  {!hasSuggestions && (
                    <div className="px-4 py-3 text-center text-xs text-[#8C8C7A]">
                      No direct title or topic match for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  )}

                  {/* Full Text Search Action Button */}
                  <div className="px-3 pt-1">
                    <button
                      type="button"
                      id="search-all-articles-action-btn"
                      onClick={() => {
                        saveRecentSearch(searchQuery);
                        setIsSearchFocused(false);
                        setMobileSearchOpen(false);
                      }}
                      className="w-full py-2 px-3 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5" />
                        <span>Search all articles for &ldquo;{searchQuery}&rdquo;</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Search Toggle Button */}
          <button
            id="mobile-search-toggle-btn"
            type="button"
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setIsSearchFocused(true);
            }}
            className="md:hidden p-2 rounded-full text-[#5A5A40] hover:bg-[#F5F5F0] border border-[#DCDCD2] transition-colors cursor-pointer"
            aria-label="Toggle mobile search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Persona Switcher Dropdown */}
          <div className="relative hidden lg:block">
            <button
              id="persona-switch-btn"
              onClick={() => {
                setShowPersonaMenu(!showPersonaMenu);
                setShowUserMenu(false);
                setIsSearchFocused(false);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] rounded-full px-3 py-1.5 transition-colors cursor-pointer"
              title="Switch Demo Persona"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span className="text-[11px] uppercase tracking-wider">Persona: <strong className="text-[#3A3A2C] font-bold">{user ? user.name.split(' ')[0] : 'Guest'}</strong></span>
              <ChevronDown className="w-3 h-3 text-[#8C8C7A]" />
            </button>

            {showPersonaMenu && (
              <div 
                id="persona-dropdown-menu"
                className="absolute right-0 mt-2 w-64 bg-[#FDFCFB] rounded-2xl shadow-xl border border-[#DCDCD2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3.5 py-2 border-b border-[#DCDCD2]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C8C7A]">1-Click Demo Personas</p>
                </div>
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    id={`persona-option-${u.id}`}
                    onClick={() => {
                      switchUser(u.id);
                      toast(`Switched active user to ${u.name}`, 'info');
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-[#F5F5F0] transition-colors cursor-pointer ${
                      user?.id === u.id ? 'bg-[#F5F5F0] border-l-2 border-[#5A5A40] font-medium' : ''
                    }`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-[#DCDCD2] shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#3A3A2C] truncate">{u.name}</p>
                      <p className="text-[10px] text-[#8C8C7A] truncate uppercase tracking-wider">@{u.username} &bull; {u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Post Button */}
          <button
            id="navbar-write-post-btn"
            onClick={onOpenCreatePost}
            className="flex items-center gap-2 bg-[#5A5A40] hover:bg-[#4A4A35] active:scale-98 text-white text-[11px] font-bold uppercase tracking-widest px-3.5 sm:px-5 py-2 rounded-full shadow-xs transition-all cursor-pointer"
          >
            <PenSquare className="w-3.5 h-3.5 text-[#F5F5F0]" />
            <span className="hidden sm:inline">Write Post</span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                id="user-avatar-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowPersonaMenu(false);
                  setIsSearchFocused(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#5A5A40]/30 transition-all cursor-pointer focus:outline-hidden"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-[#DCDCD2] shadow-2xs"
                />
              </button>

              {showUserMenu && (
                <div
                  id="user-profile-menu"
                  className="absolute right-0 mt-2 w-60 bg-[#FDFCFB] rounded-2xl shadow-xl border border-[#DCDCD2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-4 py-2.5 border-b border-[#DCDCD2]">
                    <p className="text-sm font-serif font-bold text-[#3A3A2C] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#8C8C7A] truncate">{user.email}</p>
                  </div>

                  <button
                    id="user-menu-profile-btn"
                    onClick={() => {
                      onOpenProfile(user.id);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-[#33332D] hover:bg-[#F5F5F0] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-[#8C8C7A]" />
                    <span>My Profile & Articles</span>
                  </button>

                  <button
                    id="user-menu-reset-btn"
                    onClick={handleReset}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-[#33332D] hover:bg-[#F5F5F0] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#8C8C7A]" />
                    <span>Reset Demo Data</span>
                  </button>

                  <div className="my-1 border-t border-[#DCDCD2]"></div>

                  <button
                    id="user-menu-logout-btn"
                    onClick={() => {
                      logout();
                      toast('Signed out successfully', 'info');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-[#8C4A4A] hover:bg-[#F5F5F0] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#8C4A4A]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="nav-signin-btn"
                onClick={() => onOpenAuth('login')}
                className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#3A3A2C] px-3.5 py-1.5 rounded-full hover:bg-[#F5F5F0] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                id="nav-register-btn"
                onClick={() => onOpenAuth('register')}
                className="text-[11px] font-bold uppercase tracking-widest bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen && (
        <div 
          ref={mobileSearchContainerRef}
          id="mobile-search-bar-container"
          className="md:hidden border-t border-[#DCDCD2] bg-[#FDFCFB] px-4 py-3 shadow-md animate-in slide-in-from-top-1 duration-150"
        >
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8C7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles, topics, authors..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full bg-[#F5F5F0] text-[#33332D] text-xs rounded-full pl-10 pr-10 py-2.5 border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A]"
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8C7A] hover:text-[#33332D] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Mobile Suggestions Container */}
          {isSearchFocused && (
            <div className="mt-2.5 pt-2 border-t border-[#DCDCD2]/60 max-h-64 overflow-y-auto space-y-3">
              {!queryLower ? (
                <div>
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8C7A]">Recent Searches</span>
                        <button
                          type="button"
                          onClick={clearAllRecentSearches}
                          className="text-[9px] font-bold text-rose-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectRecent(term)}
                            className="px-2.5 py-1 bg-[#F5F5F0] text-[#33332D] text-xs rounded-full border border-[#DCDCD2] flex items-center gap-1.5"
                          >
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8C7A] block mb-1">Popular Topics</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_POPULAR_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleSelectCategoryAction(topic)}
                          className="px-2.5 py-1 bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold uppercase rounded-sm border border-[#DCDCD2]"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchingArticles.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleSelectArticle(post)}
                      className="p-2 rounded-xl bg-[#F5F5F0] text-xs font-semibold text-[#1A1A17] flex items-center justify-between"
                    >
                      <span className="truncate">{post.title}</span>
                      <span className="text-[9px] text-[#8C8C7A] shrink-0 uppercase">{post.category}</span>
                    </div>
                  ))}
                  {(matchingCategories.length > 0 || matchingTags.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchingCategories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSelectCategoryAction(c)}
                          className="px-2 py-0.5 bg-[#5A5A40] text-white text-[9px] font-bold uppercase rounded-xs"
                        >
                          {c}
                        </button>
                      ))}
                      {matchingTags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSelectTagAction(t)}
                          className="px-2 py-0.5 bg-white text-[#5A5A4A] text-xs rounded-full border border-[#DCDCD2]"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setIsSearchFocused(false);
                      setMobileSearchOpen(false);
                    }}
                    className="w-full py-2 bg-[#5A5A40] text-white text-xs font-bold uppercase rounded-xl text-center"
                  >
                    Search for &ldquo;{searchQuery}&rdquo;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
