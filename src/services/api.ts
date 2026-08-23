import { Post, Comment, User, SortOption } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('blog_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async login(emailOrUsername: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  },

  async getUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    await fetch(`${API_BASE}/auth/reset-demo`, {
      method: 'POST',
    });
  },

  // Posts
  async getPosts(params?: {
    category?: string;
    tag?: string;
    authorId?: string;
    search?: string;
    sort?: SortOption;
    status?: 'published' | 'draft' | 'all';
  }): Promise<{ posts: Post[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.authorId) query.set('authorId', params.authorId);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/posts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch posts');
    }
    return res.json();
  },

  async getPostById(id: string): Promise<{ post: Post }> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Post not found');
    }
    return res.json();
  },

  async createPost(data: {
    title: string;
    summary?: string;
    content: string;
    category: string;
    tags: string[];
    coverImage?: string;
    published?: boolean;
  }): Promise<{ post: Post }> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create post');
    }
    return res.json();
  },

  async updatePost(
    id: string,
    data: Partial<{
      title: string;
      summary: string;
      content: string;
      category: string;
      tags: string[];
      coverImage: string;
      published: boolean;
    }>
  ): Promise<{ post: Post }> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update post');
    }
    return res.json();
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete post');
    }
    return res.json();
  },

  async togglePostLike(id: string): Promise<{ likesCount: number; liked: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${id}/like`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to like post');
    }
    return res.json();
  },

  // Comments
  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch comments');
    }
    return res.json();
  },

  async addComment(
    postId: string,
    content: string,
    parentId?: string | null
  ): Promise<{ comment: Comment }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to post comment');
    }
    return res.json();
  },

  async updateComment(
    postId: string,
    commentId: string,
    content: string
  ): Promise<{ comment: Comment }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update comment');
    }
    return res.json();
  },

  async deleteComment(postId: string, commentId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete comment');
    }
    return res.json();
  },

  async toggleCommentLike(
    postId: string,
    commentId: string
  ): Promise<{ likesCount: number; liked: boolean; reactions?: Record<string, string[]> }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to like comment');
    }
    return res.json();
  },

  async toggleCommentReaction(
    postId: string,
    commentId: string,
    emoji: string
  ): Promise<{ reactions: Record<string, string[]>; likesCount: number; likedBy: string[]; emoji: string; active: boolean; liked: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}/reaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to react to comment');
    }
    return res.json();
  },

  // AI Assist
  async aiAssist(type: 'summarize' | 'title_suggestions' | 'outline', content: string): Promise<{ result: string }> {
    const res = await fetch(`${API_BASE}/ai/assist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type, content }),
    });
    if (!res.ok) {
      throw new Error('AI assist unavailable');
    }
    return res.json();
  },
};
