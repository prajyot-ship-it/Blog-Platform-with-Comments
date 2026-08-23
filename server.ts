import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'blog-data.json');

// Types
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl: string;
  bio: string;
  role: 'author' | 'admin' | 'reader';
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string;
    bio?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  views: number;
  likesCount: number;
  likedBy: string[];
  published: boolean;
  commentsCount: number;
}

interface Comment {
  id: string;
  postId: string;
  parentId?: string | null;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  likedBy: string[];
  reactions?: Record<string, string[]>;
}

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  comments: Comment[];
}

// Initial Seed Data
const initialUsers: User[] = [
  {
    id: 'user_alex',
    username: 'alex_rivera',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Staff Systems Architect & open source maintainer. Writing on distributed systems, databases, and microservices.',
    role: 'author',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user_maya',
    username: 'maya_chen',
    name: 'Maya Chen',
    email: 'maya@example.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Product Design Lead & Design Systems enthusiast. Obsessed with typography, accessibility, and micro-interactions.',
    role: 'author',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'user_david',
    username: 'david_kim',
    name: 'David Kim',
    email: 'david@example.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Full-stack Engineer exploring TypeScript ecosystems, reactivity engines, and backend optimization.',
    role: 'author',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const initialPosts: Post[] = [
  {
    id: 'post_1',
    title: 'Building Scalable Event-Driven Architectures with Node.js & Message Queues',
    slug: 'building-scalable-event-driven-architectures',
    summary: 'A comprehensive guide to decoupling services, handling traffic spikes, and maintaining idempotent state in modern high-throughput backends.',
    content: `## The Evolution of Decoupled Systems

When scaling web applications beyond a single monolithic instance, synchronous HTTP communication between microservices rapidly introduces cascading latencies, tight coupling, and brittle failure domains.

### Why Event-Driven Architecture?

Event-Driven Architecture (EDA) flips the control paradigm: instead of asking a service to do something (**imperative commands**), a service simply announces that something has occurred (**declarative events**).

Key advantages include:
- **Asynchronous Decoupling**: Producers and consumers scale independently without blocking.
- **Traffic Smoothing**: Buffer burst traffic during product launches or peak loads.
- **Resilience**: Temporary downstream failures do not bring down the ingestion pipeline.

\`\`\`typescript
// Example: Safe Event Publisher with Outbox Pattern
export async function publishOrderEvent(order: OrderRecord, transaction: DBTransaction) {
  // Write to outbox table inside the main DB transaction
  await transaction.insert('outbox_events', {
    eventType: 'ORDER_CREATED',
    payload: JSON.stringify(order),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });
}
\`\`\`

### Ensuring Idempotency

Network retries are inevitable in distributed environments. Ensure your consumers implement strict idempotency keys stored in Redis or transactional storage:

> *"Always design consumers assuming duplicate events will arrive out of order."*

Let's discuss how you handle event schema evolution in the comments below!`,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    tags: ['Architecture', 'Node.js', 'Backend', 'System Design'],
    category: 'Architecture',
    authorId: 'user_alex',
    author: {
      id: 'user_alex',
      username: 'alex_rivera',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Staff Systems Architect & open source maintainer.',
      role: 'author',
    },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    readTimeMinutes: 5,
    views: 1240,
    likesCount: 88,
    likedBy: ['user_maya', 'user_david'],
    published: true,
    commentsCount: 3,
  },
  {
    id: 'post_2',
    title: 'The Art of Fluid Typography and Mathematical Layout Scales in Modern Web Design',
    slug: 'fluid-typography-and-mathematical-scales',
    summary: 'Discover how proportional modular type scales, optical spacing, and CSS clamp() create harmonious reading experiences across every screen size.',
    content: `## Designing for the Eye and the Screen

Typography on the web is fundamentally dynamic. Users read on compact 360px phones, high-density retina laptops, and expansive 4K ultrawide monitors.

### The Problem with Fixed Breakpoints

Traditional responsive typography relies on rigid media queries (\`@media (min-width: 768px)\`), which causes jarring visual leaps as the viewport crosses boundaries.

### Embracing Fluid Modular Scales

By leveraging CSS viewport mathematics with \`clamp()\`, type flows smoothly across resolution spectrums:

\`\`\`css
/* Smooth fluid headline scaling */
h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 3.75rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}
\`\`\`

### The Harmonic Rules
1. **Mathematical Step Ratios**: Adopt consistent scaling factors like Major Third (1.25) or Perfect Fourth (1.333).
2. **Inner vs. Outer Padding**: Always ensure container outer padding strictly exceeds internal element margins.
3. **Contrast & Hierarchy**: Reserve high contrast weights for structural headings while maintaining generous line height (1.6+) for body prose.

Great design is invisible—it guides reader focus without demanding conscious attention.`,
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    tags: ['Design', 'CSS', 'Typography', 'UI/UX'],
    category: 'Design',
    authorId: 'user_maya',
    author: {
      id: 'user_maya',
      username: 'maya_chen',
      name: 'Maya Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Design Lead & Design Systems enthusiast.',
      role: 'author',
    },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    readTimeMinutes: 4,
    views: 890,
    likesCount: 64,
    likedBy: ['user_alex'],
    published: true,
    commentsCount: 2,
  },
  {
    id: 'post_3',
    title: 'Mastering Full-Stack TypeScript: End-to-End Type Safety from Database to Client',
    slug: 'mastering-full-stack-typescript',
    summary: 'Practical patterns for unifying your schemas, validating REST contracts with Zod, and eliminating runtime boundary regressions.',
    content: `## Bridging the Backend & Frontend Gap

One of the largest sources of runtime bugs in web development is contract drift: when the backend API alters a response shape without the frontend knowing until runtime errors happen in production.

### Strategies for Unbreakable Contracts

1. **Shared Domain Types**: Keep pure interfaces in a shared module accessible to both Express routes and React view components.
2. **Runtime Schema Validation**: TypeScript types disappear after compilation. Validate incoming HTTP payloads with lightweight schema validators.
3. **RESTful Consistency**: Standardize response formats with uniform envelopes:

\`\`\`typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
\`\`\`

### Practical Tips
- Avoid using \`any\` as an escape hatch in route controllers.
- Use explicit return types for API handlers.
- Treat data crossing the network boundary as strictly untrusted until validated.

What tools are you using to sync frontend and backend types in your team? Let's discuss!`,
    coverImage: 'https://images.unsplash.com/photo-1516116211227-bbc13c734187?w=1200&auto=format&fit=crop&q=80',
    tags: ['TypeScript', 'Full-Stack', 'React', 'API Design'],
    category: 'Engineering',
    authorId: 'user_david',
    author: {
      id: 'user_david',
      username: 'david_kim',
      name: 'David Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Full-stack Engineer exploring TypeScript ecosystems.',
      role: 'author',
    },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    readTimeMinutes: 6,
    views: 650,
    likesCount: 42,
    likedBy: [],
    published: true,
    commentsCount: 1,
  },
];

const initialComments: Comment[] = [
  {
    id: 'comment_1',
    postId: 'post_1',
    parentId: null,
    authorId: 'user_maya',
    author: {
      id: 'user_maya',
      username: 'maya_chen',
      name: 'Maya Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'Fantastic write-up on the outbox pattern! We recently adopted this to guarantee transactional message delivery when updating user billing records, and it eliminated race conditions completely.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    likesCount: 12,
    likedBy: ['user_alex', 'user_david'],
    reactions: {
      '👍': ['user_alex', 'user_david'],
      '💡': ['user_david'],
      '🔥': ['user_alex'],
    },
  },
  {
    id: 'comment_2',
    postId: 'post_1',
    parentId: 'comment_1',
    authorId: 'user_alex',
    author: {
      id: 'user_alex',
      username: 'alex_rivera',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'Glad to hear that, Maya! The transactional outbox pattern is truly a lifesaver when dual-writing between SQL and message brokers.',
    createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
    likesCount: 6,
    likedBy: ['user_maya'],
    reactions: {
      '👍': ['user_maya'],
      '👏': ['user_maya'],
    },
  },
  {
    id: 'comment_3',
    postId: 'post_1',
    parentId: null,
    authorId: 'user_david',
    author: {
      id: 'user_david',
      username: 'david_kim',
      name: 'David Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'How do you handle Dead Letter Queues (DLQ) when schema validation fails on downstream consumers? Do you auto-retry with exponential backoff?',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    likesCount: 3,
    likedBy: [],
    reactions: {
      '💡': ['user_alex'],
    },
  },
  {
    id: 'comment_4',
    postId: 'post_2',
    parentId: null,
    authorId: 'user_david',
    author: {
      id: 'user_david',
      username: 'david_kim',
      name: 'David Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'The CSS clamp formula breakdown is super helpful. I used to write complex media query chains for headers until switching to fluid scaling.',
    createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    likesCount: 8,
    likedBy: ['user_maya'],
    reactions: {
      '👍': ['user_maya'],
      '❤️': ['user_maya'],
      '💡': ['user_alex'],
    },
  },
  {
    id: 'comment_5',
    postId: 'post_2',
    parentId: 'comment_4',
    authorId: 'user_maya',
    author: {
      id: 'user_maya',
      username: 'maya_chen',
      name: 'Maya Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'Awesome! It makes responsive maintenance so much more pleasant.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    likesCount: 4,
    likedBy: [],
    reactions: {
      '👏': ['user_david'],
    },
  },
  {
    id: 'comment_6',
    postId: 'post_3',
    parentId: null,
    authorId: 'user_alex',
    author: {
      id: 'user_alex',
      username: 'alex_rivera',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'author',
    },
    content: 'Type sharing between frontend and backend is one of the best developer experience upgrades of modern TypeScript stacks!',
    createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    likesCount: 5,
    likedBy: ['user_david'],
    reactions: {
      '👍': ['user_david'],
      '🚀': ['user_david'],
    },
  },
];

// Persistent Store Manager
class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    posts: [],
    comments: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.posts && parsed.comments) {
          this.data = parsed;
          return;
        }
      }

      // Seed initial data if file doesn't exist
      this.data = {
        users: initialUsers,
        posts: initialPosts,
        comments: initialComments,
      };
      this.persist();
    } catch (err) {
      console.error('Error initializing database file:', err);
      this.data = {
        users: initialUsers,
        posts: initialPosts,
        comments: initialComments,
      };
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database file:', err);
    }
  }

  // Users
  getUsers() {
    return this.data.users;
  }

  findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string) {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(user: User) {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // Posts
  getPosts() {
    return this.data.posts;
  }

  findPostById(id: string) {
    return this.data.posts.find((p) => p.id === id);
  }

  createPost(post: Post) {
    this.data.posts.unshift(post);
    this.persist();
    return post;
  }

  updatePost(id: string, updates: Partial<Post>) {
    const index = this.data.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.data.posts[index] = {
      ...this.data.posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.posts[index];
  }

  deletePost(id: string) {
    const postIndex = this.data.posts.findIndex((p) => p.id === id);
    if (postIndex === -1) return false;

    this.data.posts.splice(postIndex, 1);
    // Also delete associated comments
    this.data.comments = this.data.comments.filter((c) => c.postId !== id);
    this.persist();
    return true;
  }

  incrementPostViews(id: string) {
    const post = this.findPostById(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.persist();
    }
  }

  togglePostLike(postId: string, userId: string) {
    const post = this.findPostById(postId);
    if (!post) return null;

    if (!post.likedBy) post.likedBy = [];
    const index = post.likedBy.indexOf(userId);

    if (index > -1) {
      post.likedBy.splice(index, 1);
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
    } else {
      post.likedBy.push(userId);
      post.likesCount = (post.likesCount || 0) + 1;
    }
    this.persist();
    return { likesCount: post.likesCount, liked: index === -1 };
  }

  // Comments
  getCommentsByPostId(postId: string) {
    return this.data.comments.filter((c) => c.postId === postId);
  }

  findCommentById(commentId: string) {
    return this.data.comments.find((c) => c.id === commentId);
  }

  createComment(comment: Comment) {
    this.data.comments.push(comment);
    // Update post comments count
    const post = this.findPostById(comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    this.persist();
    return comment;
  }

  updateComment(commentId: string, content: string) {
    const comment = this.findCommentById(commentId);
    if (!comment) return null;

    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    this.persist();
    return comment;
  }

  deleteComment(commentId: string) {
    const commentIndex = this.data.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return false;

    const comment = this.data.comments[commentIndex];
    const postId = comment.postId;

    // Remove direct comment and any nested replies to it
    const repliesToDelete = this.data.comments.filter((c) => c.parentId === commentId);
    const totalDeleted = 1 + repliesToDelete.length;

    this.data.comments = this.data.comments.filter((c) => c.id !== commentId && c.parentId !== commentId);

    const post = this.findPostById(postId);
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 0) - totalDeleted);
    }

    this.persist();
    return true;
  }

  toggleCommentLike(commentId: string, userId: string) {
    return this.toggleCommentReaction(commentId, userId, '👍');
  }

  toggleCommentReaction(commentId: string, userId: string, emoji: string = '👍') {
    const comment = this.findCommentById(commentId);
    if (!comment) return null;

    if (!comment.reactions) {
      comment.reactions = {};
    }
    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = [];
    }

    const index = comment.reactions[emoji].indexOf(userId);
    let active = false;

    if (index > -1) {
      comment.reactions[emoji].splice(index, 1);
      if (comment.reactions[emoji].length === 0) {
        delete comment.reactions[emoji];
      }
    } else {
      comment.reactions[emoji].push(userId);
      active = true;
    }

    // Sync likedBy and likesCount for standard thumbs/heart interactions
    if (!comment.likedBy) comment.likedBy = [];
    const thumbsUsers = new Set<string>();
    Object.values(comment.reactions).forEach((userList) => {
      userList.forEach((uid) => thumbsUsers.add(uid));
    });
    comment.likedBy = Array.from(thumbsUsers);
    comment.likesCount = comment.likedBy.length;

    this.persist();
    return {
      reactions: comment.reactions,
      likesCount: comment.likesCount,
      likedBy: comment.likedBy,
      emoji,
      active,
      liked: comment.likedBy.includes(userId),
    };
  }

  resetSeedData() {
    this.data = {
      users: initialUsers,
      posts: initialPosts,
      comments: initialComments,
    };
    this.persist();
    return true;
  }
}

const db = new DatabaseStore();

// Express Server Initialization
async function startServer() {
  const app = express();
  app.use(express.json());

  // Simple token helper: "Bearer user_<id>" or "Bearer token_<id>"
  const getUserFromReq = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return null;

    // Extract user id from token (e.g. "user_alex" or "token_user_alex")
    const userId = token.startsWith('token_') ? token.replace('token_', '') : token;
    return db.findUserById(userId) || null;
  };

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. Auth Endpoints
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, username, email, password, bio, avatarUrl } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Name, username, email, and password are required' });
      }

      if (db.findUserByEmail(email)) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      if (db.findUserByUsername(username)) {
        return res.status(409).json({ error: 'Username is already taken' });
      }

      const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser: User = {
        id,
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim().toLowerCase(),
        passwordHash: password,
        bio: bio?.trim() || 'Writer, reader, and enthusiast.',
        avatarUrl: avatarUrl?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
        role: 'author',
        createdAt: new Date().toISOString(),
      };

      db.createUser(newUser);

      const safeUser = { ...newUser };
      delete safeUser.passwordHash;

      res.status(201).json({
        token: `token_${newUser.id}`,
        user: safeUser,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register user' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Email/Username and password are required' });
      }

      const user =
        db.findUserByEmail(emailOrUsername) ||
        db.findUserByUsername(emailOrUsername);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
      }

      // Check password (simple comparison for demonstration)
      if (user.passwordHash && user.passwordHash !== password) {
        return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      }

      const safeUser = { ...user };
      delete safeUser.passwordHash;

      res.json({
        token: `token_${user.id}`,
        user: safeUser,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    res.json({ user: safeUser });
  });

  app.get('/api/auth/users', (req, res) => {
    const users = db.getUsers().map((u) => {
      const safe = { ...u };
      delete safe.passwordHash;
      return safe;
    });
    res.json({ users });
  });

  app.post('/api/auth/reset-demo', (req, res) => {
    db.resetSeedData();
    res.json({ message: 'Sample database reset to default successfully' });
  });

  // 2. Posts Endpoints
  app.get('/api/posts', (req, res) => {
    try {
      const { category, tag, authorId, search, sort = 'latest', status = 'published' } = req.query;
      let posts = [...db.getPosts()];

      // Filter by published status (allow author to see own drafts)
      const currentUser = getUserFromReq(req);
      if (status === 'draft') {
        if (!currentUser) {
          return res.status(401).json({ error: 'Must be logged in to view drafts' });
        }
        posts = posts.filter((p) => !p.published && p.authorId === currentUser.id);
      } else if (status === 'all') {
        if (!currentUser) {
          posts = posts.filter((p) => p.published);
        } else {
          posts = posts.filter((p) => p.published || p.authorId === currentUser.id);
        }
      } else {
        posts = posts.filter((p) => p.published);
      }

      // Category filter
      if (category && typeof category === 'string' && category !== 'All') {
        posts = posts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }

      // Tag filter
      if (tag && typeof tag === 'string') {
        posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
      }

      // Author filter
      if (authorId && typeof authorId === 'string') {
        posts = posts.filter((p) => p.authorId === authorId);
      }

      // Search filter (title, summary, tags, content)
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        posts = posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.summary.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)) ||
            p.author.name.toLowerCase().includes(q)
        );
      }

      // Sort
      if (sort === 'popular') {
        posts.sort((a, b) => (b.likesCount + b.views) - (a.likesCount + a.views));
      } else if (sort === 'discussed') {
        posts.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
      } else {
        // default latest
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      res.json({ posts, total: posts.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch posts' });
    }
  });

  app.get('/api/posts/:id', (req, res) => {
    try {
      const post = db.findPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Increment view count
      db.incrementPostViews(post.id);

      res.json({ post });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch post' });
    }
  });

  app.post('/api/posts', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to create a post' });
      }

      const { title, summary, content, category, tags, coverImage, published = true } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Estimate read time (~200 words per minute)
      const wordCount = (content + ' ' + title).trim().split(/\s+/).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      const newPost: Post = {
        id,
        title: title.trim(),
        slug,
        summary: summary?.trim() || content.substring(0, 160).replace(/[#*`_]/g, '').trim() + '...',
        content: content.trim(),
        category: category || 'Engineering',
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : ['General'],
        coverImage:
          coverImage?.trim() ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
        authorId: user.id,
        author: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTimeMinutes,
        views: 1,
        likesCount: 0,
        likedBy: [],
        published: Boolean(published),
        commentsCount: 0,
      };

      db.createPost(newPost);
      res.status(201).json({ post: newPost });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create post' });
    }
  });

  app.put('/api/posts/:id', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const post = db.findPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check author permissions
      if (post.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to edit this post' });
      }

      const { title, summary, content, category, tags, coverImage, published } = req.body;

      const updates: Partial<Post> = {};
      if (title !== undefined) {
        updates.title = title.trim();
        updates.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (content !== undefined) {
        updates.content = content.trim();
        const wordCount = (updates.content + ' ' + (updates.title || post.title)).trim().split(/\s+/).length;
        updates.readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      }
      if (summary !== undefined) updates.summary = summary.trim();
      if (category !== undefined) updates.category = category;
      if (tags !== undefined && Array.isArray(tags)) {
        updates.tags = tags.map((t: string) => t.trim()).filter(Boolean);
      }
      if (coverImage !== undefined) updates.coverImage = coverImage.trim();
      if (published !== undefined) updates.published = Boolean(published);

      const updated = db.updatePost(post.id, updates);
      res.json({ post: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update post' });
    }
  });

  app.delete('/api/posts/:id', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const post = db.findPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to delete this post' });
      }

      db.deletePost(post.id);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete post' });
    }
  });

  app.post('/api/posts/:id/like', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Please sign in to like posts' });
      }

      const result = db.togglePostLike(req.params.id, user.id);
      if (!result) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to like post' });
    }
  });

  // 3. Comments Endpoints
  app.get('/api/posts/:id/comments', (req, res) => {
    try {
      const comments = db.getCommentsByPostId(req.params.id);
      // Sort oldest to newest for chronological flow
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      res.json({ comments });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch comments' });
    }
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to post comments' });
      }

      const post = db.findPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const { content, parentId } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
      }

      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        postId: post.id,
        parentId: parentId || null,
        authorId: user.id,
        author: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        content: content.trim(),
        createdAt: new Date().toISOString(),
        likesCount: 0,
        likedBy: [],
      };

      db.createComment(newComment);
      res.status(201).json({ comment: newComment });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add comment' });
    }
  });

  app.put('/api/posts/:id/comments/:commentId', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const comment = db.findCommentById(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to edit this comment' });
      }

      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }

      const updated = db.updateComment(comment.id, content.trim());
      res.json({ comment: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update comment' });
    }
  });

  app.delete('/api/posts/:id/comments/:commentId', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const comment = db.findCommentById(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to delete this comment' });
      }

      db.deleteComment(comment.id);
      res.json({ success: true, message: 'Comment deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete comment' });
    }
  });

  app.post('/api/posts/:id/comments/:commentId/like', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Please sign in to like comments' });
      }

      const result = db.toggleCommentLike(req.params.commentId, user.id);
      if (!result) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to like comment' });
    }
  });

  app.post('/api/posts/:id/comments/:commentId/reaction', (req, res) => {
    try {
      const user = getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Please sign in to react to comments' });
      }

      const { emoji } = req.body;
      const validEmoji = typeof emoji === 'string' && emoji.trim() ? emoji.trim() : '👍';

      const result = db.toggleCommentReaction(req.params.commentId, user.id, validEmoji);
      if (!result) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to react to comment' });
    }
  });

  // 4. AI Writing Assistant Route (optional enhancement using @google/genai)
  app.post('/api/ai/assist', async (req, res) => {
    try {
      const { prompt, type, content } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Return structured fallback helper if no API key is provided
        if (type === 'summarize') {
          return res.json({
            result: content ? content.slice(0, 150) + '...' : 'A thoughtful deep dive exploring modern engineering practices and practical techniques.',
          });
        }
        if (type === 'title_suggestions') {
          return res.json({
            result: '1. Mastering Modern Web Architectures\n2. Key Lessons from Building High-Scale Systems\n3. The Pragmatic Developer Guide to Clean Design',
          });
        }
        return res.json({
          result: 'Generated content outline:\n- Introduction & Background\n- Core Problem Statement\n- Practical Implementation Steps\n- Best Practices & Benchmarks\n- Conclusion & Discussion',
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      let systemInstruction = 'You are an editorial writing assistant for a premier tech and design blog platform. Provide clean, concise, impactful markdown output without fluff.';

      if (type === 'summarize') {
        systemInstruction += ' Generate a crisp 2-sentence summary/excerpt suitable for blog cards.';
      } else if (type === 'title_suggestions') {
        systemInstruction += ' Suggest 3 compelling, non-clickbait titles for the article.';
      } else if (type === 'outline') {
        systemInstruction += ' Provide a structured markdown outline with section headers and key talking points.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt || `Assist with this blog post content:\n${content}`,
        config: {
          systemInstruction,
        },
      });

      res.json({ result: response.text });
    } catch (err: any) {
      console.error('AI assistant error:', err);
      res.status(500).json({ error: 'AI assist failed', details: err.message });
    }
  });

  // ----------------------------------------------------
  // Vite Middleware & Static Serving
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blogging Platform Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
