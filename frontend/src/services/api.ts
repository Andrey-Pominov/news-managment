import {
  ApiResponse,
  PaginatedResponse,
  Post,
  PostListItem,
  PostQueryParameters,
  CreatePostRequest,
  UpdatePostRequest,
} from '../types/api';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

    return filteredParams.length > 0 ? `?${filteredParams.join('&')}` : '';
  }

  async getPosts(params: PostQueryParameters = {}): Promise<ApiResponse<PaginatedResponse<PostListItem>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<PostListItem>>(`/posts${queryString}`);
  }

  async getPost(id: number): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/${id}`);
  }

  async getPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/slug/${slug}`);
  }

  async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: number): Promise<ApiResponse<null>> {
    return this.request<null>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async publishPost(id: number): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishPost(id: number): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/posts/${id}/unpublish`, {
      method: 'POST',
    });
  }


  async getPostsForDisplay(searchTerm?: string, languageCode = 'en') {
    const params: PostQueryParameters = {
      languageCode,
      pageSize: 50,
    };

    if (searchTerm) {
      params.searchTerm = searchTerm;
    }


    return this.getPosts(params);
  }
}

export const apiService = new ApiService();
export default apiService;
