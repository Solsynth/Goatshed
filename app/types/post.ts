export interface MediaFile {
  id: string;
  name?: string | null;
  url?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Publisher {
  id: string;
  name: string;
  nick: string | null;
  bio: string | null;
  picture?: MediaFile | null;
  background?: MediaFile | null;
  attachments?: MediaFile[];
  verification: {
    type: number;
    title: string | null;
    description: string | null;
    verifiedBy: string | null;
  } | null;
}

export interface PostTag {
  id: string;
  slug: string;
  name: string;
}

export interface Post {
  id: string;
  slug?: string | null;
  type?: number;
  title: string | null;
  description: string | null;
  content: string;
  picture?: MediaFile | null;
  background?: MediaFile | null;
  attachments?: MediaFile[];
  publishedAt: string;
  viewsUnique: number;
  viewsTotal: number;
  repliesCount: number;
  isTruncated: boolean;
  publisher: Publisher;
  tags: PostTag[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
}
