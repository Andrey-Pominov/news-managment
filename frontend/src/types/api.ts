export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export enum PostStatus {
  Draft = 0,
  Published = 1,
  Archived = 2
}

export interface PostListItem {
  id: number;
  slug: string;
  authorName: string;
  status: PostStatus;
  featuredImageUrl?: string;
  createdAt: string;
  publishedAt?: string;
  viewCount: number;
  isFeatured: boolean;
  title: string;
  summary?: string;
}

export interface Post {
  id: number;
  slug: string;
  authorId: string;
  status: PostStatus;
  featuredImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  viewCount: number;
  isFeatured: boolean;
  translations: {
    id: number;
    postId: number;
    languageCode: string;
    title: string;
    content: string;
    summary?: string;
    metaTitle?: string;
    metaDescription?: string;
  }[];
}


export interface PostQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: PostStatus;
  languageCode?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



export interface CreatePostRequest {
  slug: string;
  featuredImageUrl?: string;
  isFeatured: boolean;
  status: PostStatus;
  translations: {
    languageCode: string;
    title: string;
    content: string;
    summary?: string;
    metaTitle?: string;
    metaDescription?: string;
  }[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: number;
}