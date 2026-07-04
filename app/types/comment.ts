export interface CommentAuthor {
  id: string;
  name: string;
  nick: string | null;
  avatar: string | null;
}

export interface SolarPostAuthor {
  id: string;
  name: string;
  nick?: string | null;
  picture?: { id: string } | null;
}

export interface SolarPost {
  id: string;
  content: string;
  createdAt: string;
  publishedAt: string;
  editedAt?: string | null;
  updatedAt: string;
  publisher?: SolarPostAuthor;
  account?: SolarPostAuthor;
  repliedPost?: { id: string } | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: CommentAuthor;
  replies?: Comment[];
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  symbol: string;
  createdAt: string;
}

export interface ReactionSummary {
  symbol: string;
  count: number;
  reacted: boolean;
}

export interface ReactionListResponse {
  reactions: ReactionSummary[];
  total: number;
}
