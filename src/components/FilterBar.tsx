import React from 'react';
import { SortOption } from '../types';
import { Sparkles, Flame, MessageSquare, Clock, Tag, X, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CATEGORIES = [
  'All',
  'Engineering',
  'Architecture',
  'Design',
  'Product',
  'Tutorials',
];

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedTag: string | null;
  onClearTag: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  statusFilter: 'published' | 'draft' | 'all';
  onStatusFilterChange: (status: 'published' | 'draft' | 'all') => void;
  totalPosts: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onClearTag,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  totalPosts,
}) => {
  const { user } = useAuth();

  return (
    <div id="filter-bar-section" className="space-y-4 pt-4 pb-2">
      {/* Category Pills & Post Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCDCD2] pb-4">
        
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`category-filter-${cat.toLowerCase()}`}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-[#F5F5F0] text-[#5A5A4A] hover:bg-[#E5E5DE] hover:text-[#33332D]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort & Status controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Status Filter (If Logged In) */}
          {user && (
            <div className="flex items-center bg-[#F5F5F0] p-0.5 rounded-full border border-[#DCDCD2] text-xs">
              <button
                id="filter-status-published"
                onClick={() => onStatusFilterChange('published')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  statusFilter === 'published' ? 'bg-white text-[#3A3A2C] shadow-2xs' : 'text-[#8C8C7A] hover:text-[#33332D]'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-[#5A5A40]" />
                <span>Published</span>
              </button>
              <button
                id="filter-status-draft"
                onClick={() => onStatusFilterChange('draft')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  statusFilter === 'draft' ? 'bg-white text-[#3A3A2C] shadow-2xs' : 'text-[#8C8C7A] hover:text-[#33332D]'
                }`}
              >
                <FileText className="w-3 h-3 text-[#8C8C7A]" />
                <span>Drafts</span>
              </button>
            </div>
          )}

          {/* Sort Buttons */}
          <div className="flex items-center bg-[#F5F5F0] p-0.5 rounded-full border border-[#DCDCD2] text-xs">
            <button
              id="sort-latest-btn"
              onClick={() => onSortChange('latest')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                sortBy === 'latest' ? 'bg-white text-[#3A3A2C] shadow-2xs' : 'text-[#8C8C7A] hover:text-[#33332D]'
              }`}
              title="Latest Articles"
            >
              <Clock className="w-3 h-3" />
              <span className="hidden sm:inline">Latest</span>
            </button>
            <button
              id="sort-popular-btn"
              onClick={() => onSortChange('popular')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                sortBy === 'popular' ? 'bg-white text-[#3A3A2C] shadow-2xs' : 'text-[#8C8C7A] hover:text-[#33332D]'
              }`}
              title="Most Popular & Viewed"
            >
              <Flame className="w-3 h-3 text-[#5A5A40]" />
              <span className="hidden sm:inline">Popular</span>
            </button>
            <button
              id="sort-discussed-btn"
              onClick={() => onSortChange('discussed')}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                sortBy === 'discussed' ? 'bg-white text-[#3A3A2C] shadow-2xs' : 'text-[#8C8C7A] hover:text-[#33332D]'
              }`}
              title="Most Discussed"
            >
              <MessageSquare className="w-3 h-3 text-[#8C8C7A]" />
              <span className="hidden sm:inline">Discussed</span>
            </button>
          </div>

        </div>
      </div>

      {/* Active Tag Filter Banner */}
      {selectedTag && (
        <div className="flex items-center justify-between bg-[#E5E5DE]/80 border border-[#DCDCD2] rounded-2xl px-4 py-2.5 text-xs text-[#3A3A2C]">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span>Filtering posts tagged with: <strong className="font-bold text-[#1A1A17]">#{selectedTag}</strong></span>
            <span className="text-[#8C8C7A]">&bull;</span>
            <span className="text-[#5A5A4A]">{totalPosts} result{totalPosts === 1 ? '' : 's'}</span>
          </div>
          <button
            id="clear-tag-filter-btn"
            onClick={onClearTag}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#3A3A2C] cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#DCDCD2] transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
};
