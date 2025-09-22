using NewsManagementAPI.DTOs;

namespace NewsManagementAPI.Services;


public interface IPostService
{
    Task<ApiResponse<PaginatedResponse<PostListItemDto>>> GetPostsAsync(PostQueryParameters parameters);
    Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(int id);
    Task<ApiResponse<PostResponseDto>> GetPostBySlugAsync(string slug, string? language = null);
    Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostRequestDto request, string authorId);
    Task<ApiResponse<PostResponseDto>> UpdatePostAsync(int id, UpdatePostRequestDto request, string authorId);
    Task<ApiResponse<bool>> DeletePostAsync(int id, string authorId);
    Task<ApiResponse<bool>> IncrementViewCountAsync(int id);
    Task<ApiResponse<PaginatedResponse<PostListItemDto>>> SearchPostsAsync(string searchTerm, PostQueryParameters parameters);
}