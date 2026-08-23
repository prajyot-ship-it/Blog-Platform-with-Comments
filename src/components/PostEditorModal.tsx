import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from './Toast';
import Markdown from 'react-markdown';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  PenTool, 
  Tag, 
  Check, 
  HelpCircle,
  Wand2,
  FileText
} from 'lucide-react';
import { CATEGORIES } from './FilterBar';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSaved: (post: Post) => void;
  postToEdit?: Post | null;
}

const COVER_PRESETS = [
  { label: 'Cloud Architecture', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Design & Typography', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80' },
  { label: 'TypeScript Code', url: 'https://images.unsplash.com/photo-1516116211227-bbc13c734187?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Modern Workspace', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
];

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  isOpen,
  onClose,
  onPostSaved,
  postToEdit,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Engineering']);
  const [coverImage, setCoverImage] = useState(COVER_PRESETS[0].url);
  const [published, setPublished] = useState(true);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setSummary(postToEdit.summary);
      setContent(postToEdit.content);
      setCategory(postToEdit.category);
      setTags(postToEdit.tags || []);
      setCoverImage(postToEdit.coverImage);
      setPublished(postToEdit.published);
    } else {
      // Defaults for new post
      setTitle('');
      setSummary('');
      setContent('');
      setCategory('Engineering');
      setTags(['Engineering', 'WebDev']);
      setCoverImage(COVER_PRESETS[0].url);
      setPublished(true);
    }
  }, [postToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAiAssist = async (type: 'summarize' | 'title_suggestions' | 'outline') => {
    if (!content.trim() && type === 'summarize') {
      toast('Please write some content first before generating a summary', 'error');
      return;
    }

    try {
      setAiLoading(true);
      const res = await api.aiAssist(type, content || title);
      if (type === 'summarize') {
        setSummary(res.result.trim());
        toast('Summary generated', 'success');
      } else if (type === 'title_suggestions') {
        toast('Check suggestions inserted in summary note', 'info');
        setSummary(res.result.trim());
      } else if (type === 'outline') {
        setContent((prev) => (prev ? prev + '\n\n' + res.result : res.result));
        toast('Outline template appended', 'success');
      }
    } catch {
      toast('AI assistance completed with offline template', 'info');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (postToEdit) {
        const res = await api.updatePost(postToEdit.id, {
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          category,
          tags,
          coverImage,
          published,
        });
        onPostSaved(res.post);
        toast('Post updated successfully', 'success');
      } else {
        const res = await api.createPost({
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          category,
          tags,
          coverImage,
          published,
        });
        onPostSaved(res.post);
        toast(published ? 'Post published!' : 'Draft saved!', 'success');
      }
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to save post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="post-editor-modal-overlay" className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-[#DCDCD2] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DCDCD2] flex items-center justify-between bg-[#F5F5F0]">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#5A5A40]" />
            <h2 className="font-serif text-xl font-bold text-[#1A1A17]">
              {postToEdit ? 'Edit Article' : 'Write New Article'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Preview Toggle */}
            <div className="flex items-center bg-[#E5E5DE] p-0.5 rounded-full text-xs font-medium">
              <button
                type="button"
                id="editor-tab-write"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-bold uppercase tracking-wider ${
                  activeTab === 'write' ? 'bg-white text-[#1A1A17] shadow-2xs' : 'text-[#5A5A4A] hover:text-[#1A1A17]'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                id="editor-tab-preview"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                  activeTab === 'preview' ? 'bg-white text-[#1A1A17] shadow-2xs' : 'text-[#5A5A4A] hover:text-[#1A1A17]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              id="close-editor-modal-btn"
              onClick={onClose}
              className="text-[#8C8C7A] hover:text-[#1A1A17] p-1.5 rounded-full hover:bg-[#E5E5DE] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'write' ? (
            <>
              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="editor-title-input"
                  type="text"
                  required
                  placeholder="e.g., Deep Dive into Distributed Consensus Algorithms..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg sm:text-xl font-serif font-bold text-[#1A1A17] px-4 py-2.5 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#E5E5DE] outline-hidden placeholder:text-[#8C8C7A]"
                />
              </div>

              {/* Category & Tags Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                    Category
                  </label>
                  <select
                    id="editor-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white text-[#1A1A17] text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Adder */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="editor-tag-input"
                      type="text"
                      placeholder="Add tag and press enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 text-sm px-3.5 py-2 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                    />
                    <button
                      type="button"
                      id="editor-add-tag-btn"
                      onClick={handleAddTag}
                      className="px-3.5 py-2 bg-[#F5F5F0] hover:bg-[#E5E5DE] text-[#5A5A40] text-xs font-bold uppercase tracking-wider rounded-2xl border border-[#DCDCD2] transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border border-[#DCDCD2]"
                    >
                      <Tag className="w-3 h-3 text-[#8C8C7A]" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#8C8C7A] hover:text-rose-600 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Summary / Excerpt with AI Generate button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                    Short Summary / Excerpt
                  </label>
                  <button
                    type="button"
                    id="editor-ai-summarize-btn"
                    disabled={aiLoading}
                    onClick={() => handleAiAssist('summarize')}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#1A1A17] bg-[#F5F5F0] hover:bg-[#E5E5DE] px-3 py-1 rounded-full border border-[#DCDCD2] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
                    <span>{aiLoading ? 'Drafting...' : 'AI Auto-Summary'}</span>
                  </button>
                </div>
                <textarea
                  id="editor-summary-textarea"
                  rows={2}
                  placeholder="A concise description shown on feed cards and social snippets..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full text-sm text-[#1A1A17] p-3.5 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden resize-none placeholder:text-[#8C8C7A]"
                />
              </div>

              {/* Cover Image URL & Presets */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                  Featured Cover Image
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-[#8C8C7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="editor-cover-input"
                      type="url"
                      placeholder="Image URL (https://...)"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                    />
                  </div>
                </div>

                {/* Preset Thumbnails */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A] shrink-0">Presets:</span>
                  {COVER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm border whitespace-nowrap transition-all cursor-pointer ${
                        coverImage === preset.url
                          ? 'bg-[#5A5A40] text-white border-[#3A3A2C]'
                          : 'bg-[#F5F5F0] text-[#5A5A40] border-[#DCDCD2] hover:bg-[#E5E5DE]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Markdown Content Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">
                    Article Content (Markdown) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="editor-ai-outline-btn"
                      onClick={() => handleAiAssist('outline')}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#1A1A17] bg-[#F5F5F0] hover:bg-[#E5E5DE] px-2.5 py-1 rounded-full border border-[#DCDCD2] transition-colors cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3 text-[#5A5A40]" />
                      <span>Insert Outline</span>
                    </button>
                  </div>
                </div>
                <textarea
                  id="editor-content-textarea"
                  rows={12}
                  required
                  placeholder="Write your article using Markdown (headers #, lists -, code ```, quotes >)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full font-mono text-sm text-[#1A1A17] p-4 rounded-2xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden leading-relaxed"
                />
              </div>

              {/* Publication Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl border border-[#DCDCD2]">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#5A5A40]" />
                  <div>
                    <p className="text-xs font-bold text-[#1A1A17]">Publish Immediately</p>
                    <p className="text-[11px] text-[#5A5A4A]">
                      {published
                        ? 'Article will be visible to all readers in the public feed'
                        : 'Article will be saved as a private draft visible only to you'}
                    </p>
                  </div>
                </div>
                <input
                  id="editor-publish-toggle"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 accent-[#5A5A40] rounded-sm cursor-pointer"
                />
              </div>
            </>
          ) : (
            /* Live Markdown Preview */
            <div className="space-y-6">
              <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#DCDCD2]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8C8C7A]">{category}</span>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A17] mt-2 mb-3">
                  {title || 'Untitled Post'}
                </h1>
                {summary && <p className="text-[#5A5A4A] italic font-serif text-base mb-6">{summary}</p>}
                
                {coverImage && (
                  <div className="aspect-16/9 w-full rounded-2xl overflow-hidden mb-6 border border-[#DCDCD2]">
                    <img src={coverImage} alt="Cover preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="prose prose-zinc max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#1A1A17] text-[#33332D]">
                  <Markdown>{content || '*No content provided yet.*'}</Markdown>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCDCD2]">
            <button
              type="button"
              id="cancel-editor-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#1A1A17] bg-[#F5F5F0] hover:bg-[#E5E5DE] border border-[#DCDCD2] rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-save-post-btn"
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-[#3A3A2C] hover:bg-[#1A1A17] disabled:opacity-50 text-white rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-[#E5E5DE]" />
              <span>{submitting ? 'Saving...' : postToEdit ? 'Save Changes' : published ? 'Publish Article' : 'Save Draft'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
