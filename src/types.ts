export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: 'author' | 'admin' | 'reader';
  createdAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  role?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  authorId: string;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  views: number;
  likesCount: number;
  likedBy: string[];
  published: boolean;
  commentsCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string | null;
  authorId: string;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  likedBy: string[];
  reactions?: Record<string, string[]>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type SortOption = 'latest' | 'popular' | 'discussed';
