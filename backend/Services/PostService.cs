using Microsoft.EntityFrameworkCore;
using NewsManagementAPI.Data;
using NewsManagementAPI.DTOs;
using NewsManagementAPI.Models;

namespace NewsManagementAPI.Services;

public class PostService(ApplicationDbContext context, ILogger<PostService> logger) : IPostService
{
    public async Task<ApiResponse<PaginatedResponse<PostListItemDto>>> GetPostsAsync(PostQueryParameters parameters)
    {
        try
        {
            var query = context.Posts
                .Include(p => p.Author)
                .Include(p => p.Translations)
                .AsQueryable();

            if (!string.IsNullOrEmpty(parameters.Status) &&
                Enum.TryParse<PostStatus>(parameters.Status, true, out var status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (!string.IsNullOrEmpty(parameters.AuthorId))
            {
                query = query.Where(p => p.AuthorId == parameters.AuthorId);
            }

            if (parameters.IsFeatured.HasValue)
            {
                query = query.Where(p => p.IsFeatured == parameters.IsFeatured.Value);
            }

            if (parameters.FromDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt >= parameters.FromDate.Value);
            }

            if (parameters.ToDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt <= parameters.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(parameters.Search))
            {
                query = query.Where(p => p.Translations.Any(t =>
                    t.Title.Contains(parameters.Search) || t.Content.Contains(parameters.Search)));
            }

            query = parameters.SortBy?.ToLower() switch
            {
                "title" => parameters.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(p =>
                        p.Translations.FirstOrDefault(t => t.LanguageCode == (parameters.Language ?? "en")).Title)
                    : query.OrderBy(p =>
                        p.Translations.FirstOrDefault(t => t.LanguageCode == (parameters.Language ?? "en")).Title),
                "publishedat" => parameters.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.PublishedAt)
                    : query.OrderBy(p => p.PublishedAt),
                "viewcount" => parameters.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.ViewCount)
                    : query.OrderBy(p => p.ViewCount),
                _ => parameters.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.CreatedAt)
                    : query.OrderBy(p => p.CreatedAt)
            };

            var totalItems = await query.CountAsync();

            var posts = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var postDtos = posts.Select(p => MapToPostListItemDto(p, parameters.Language ?? "en")).ToList();

            var response = new PaginatedResponse<PostListItemDto>
            {
                Data = postDtos,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / parameters.PageSize)
            };

            return ApiResponse<PaginatedResponse<PostListItemDto>>.SuccessResponse(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving posts");
            return ApiResponse<PaginatedResponse<PostListItemDto>>.ErrorResponse(
                "An error occurred while retrieving posts.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(int id)
    {
        try
        {
            var post = await context.Posts
                .Include(p => p.Author)
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("Post not found.");
            }

            var postDto = MapToPostResponseDto(post);
            return ApiResponse<PostResponseDto>.SuccessResponse(postDto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving post {PostId}", id);
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while retrieving the post.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> GetPostBySlugAsync(string slug, string? language = null)
    {
        try
        {
            var post = await context.Posts
                .Include(p => p.Author)
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("Post not found.");
            }

            var postDto = MapToPostResponseDto(post);
            return ApiResponse<PostResponseDto>.SuccessResponse(postDto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving post by slug {Slug}", slug);
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while retrieving the post.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostRequestDto request, string authorId)
    {
        try
        {
            if (await context.Posts.AnyAsync(p => p.Slug == request.Slug))
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("A post with this slug already exists.");
            }

            var post = new Post
            {
                AuthorId = authorId,
                Slug = request.Slug,
                FeaturedImageUrl = request.FeaturedImageUrl,
                Status = request.Status,
                PublishedAt = request.PublishedAt,
                IsFeatured = request.IsFeatured
            };

            context.Posts.Add(post);
            await context.SaveChangesAsync();

            foreach (var translation in request.Translations.Select(translationDto => new PostTranslation
                     {
                         PostId = post.Id,
                         LanguageCode = translationDto.LanguageCode,
                         Title = translationDto.Title,
                         Content = translationDto.Content,
                         Summary = translationDto.Summary,
                         MetaTitle = translationDto.MetaTitle,
                         MetaDescription = translationDto.MetaDescription
                     }))
            {
                context.PostTranslations.Add(translation);
            }

            await context.SaveChangesAsync();

            var createdPost = await GetPostByIdAsync(post.Id);
            return createdPost;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating post");
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while creating the post.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> UpdatePostAsync(int id, UpdatePostRequestDto request,
        string authorId)
    {
        try
        {
            var post = await context.Posts
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("Post not found.");
            }

            if (post.AuthorId != authorId)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("You can only edit your own posts.");
            }

            if (!string.IsNullOrEmpty(request.Slug) && request.Slug != post.Slug)
            {
                if (await context.Posts.AnyAsync(p => p.Slug == request.Slug && p.Id != id))
                {
                    return ApiResponse<PostResponseDto>.ErrorResponse("A post with this slug already exists.");
                }

                post.Slug = request.Slug;
            }

            if (request.FeaturedImageUrl != null)
                post.FeaturedImageUrl = request.FeaturedImageUrl;

            if (request.Status.HasValue)
                post.Status = request.Status.Value;

            if (request.PublishedAt.HasValue)
                post.PublishedAt = request.PublishedAt.Value;

            if (request.IsFeatured.HasValue)
                post.IsFeatured = request.IsFeatured.Value;

            if (request.Translations != null)
            {
                foreach (var translationDto in request.Translations)
                {
                    var existingTranslation = post.Translations
                        .FirstOrDefault(t => t.LanguageCode == translationDto.LanguageCode);

                    if (existingTranslation != null)
                    {
                        if (!string.IsNullOrEmpty(translationDto.Title))
                            existingTranslation.Title = translationDto.Title;
                        if (!string.IsNullOrEmpty(translationDto.Content))
                            existingTranslation.Content = translationDto.Content;
                        if (translationDto.Summary != null)
                            existingTranslation.Summary = translationDto.Summary;
                        if (translationDto.MetaTitle != null)
                            existingTranslation.MetaTitle = translationDto.MetaTitle;
                        if (translationDto.MetaDescription != null)
                            existingTranslation.MetaDescription = translationDto.MetaDescription;
                    }
                    else
                    {
                        var newTranslation = new PostTranslation
                        {
                            PostId = post.Id,
                            LanguageCode = translationDto.LanguageCode,
                            Title = translationDto.Title ?? string.Empty,
                            Content = translationDto.Content ?? string.Empty,
                            Summary = translationDto.Summary,
                            MetaTitle = translationDto.MetaTitle,
                            MetaDescription = translationDto.MetaDescription
                        };

                        context.PostTranslations.Add(newTranslation);
                    }
                }
            }

            await context.SaveChangesAsync();

            var updatedPost = await GetPostByIdAsync(post.Id);
            return updatedPost;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating post {PostId}", id);
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while updating the post.");
        }
    }

    public async Task<ApiResponse<bool>> DeletePostAsync(int id, string authorId)
    {
        try
        {
            var post = await context.Posts.FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<bool>.ErrorResponse("Post not found.");
            }

            if (post.AuthorId != authorId)
            {
                return ApiResponse<bool>.ErrorResponse("You can only delete your own posts.");
            }

            context.Posts.Remove(post);
            await context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Post deleted successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting post {PostId}", id);
            return ApiResponse<bool>.ErrorResponse("An error occurred while deleting the post.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> PublishPostAsync(int id, string authorId)
    {
        try
        {
            var post = await context.Posts.FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("Post not found.");
            }

            if (post.AuthorId != authorId)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("You can only publish your own posts.");
            }

            post.Status = PostStatus.Published;
            post.PublishedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            var updatedPost = await GetPostByIdAsync(post.Id);
            return updatedPost;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error publishing post {PostId}", id);
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while publishing the post.");
        }
    }

    public async Task<ApiResponse<PostResponseDto>> ArchivePostAsync(int id, string authorId)
    {
        try
        {
            var post = await context.Posts.FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("Post not found.");
            }

            if (post.AuthorId != authorId)
            {
                return ApiResponse<PostResponseDto>.ErrorResponse("You can only archive your own posts.");
            }

            post.Status = PostStatus.Archived;

            await context.SaveChangesAsync();

            var updatedPost = await GetPostByIdAsync(post.Id);
            return updatedPost;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error archiving post {PostId}", id);
            return ApiResponse<PostResponseDto>.ErrorResponse("An error occurred while archiving the post.");
        }
    }

    public async Task<ApiResponse<bool>> IncrementViewCountAsync(int id)
    {
        try
        {
            var post = await context.Posts.FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return ApiResponse<bool>.ErrorResponse("Post not found.");
            }

            post.ViewCount++;
            await context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error incrementing view count for post {PostId}", id);
            return ApiResponse<bool>.ErrorResponse("An error occurred while updating view count.");
        }
    }

    public async Task<ApiResponse<List<PostListItemDto>>> GetFeaturedPostsAsync(string? language = null, int count = 10)
    {
        try
        {
            var posts = await context.Posts
                .Include(p => p.Author)
                .Include(p => p.Translations)
                .Where(p => p.IsFeatured && p.Status == PostStatus.Published)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .ToListAsync();

            var postDtos = posts.Select(p => MapToPostListItemDto(p, language ?? "en")).ToList();
            return ApiResponse<List<PostListItemDto>>.SuccessResponse(postDtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving featured posts");
            return ApiResponse<List<PostListItemDto>>.ErrorResponse(
                "An error occurred while retrieving featured posts.");
        }
    }

    public async Task<ApiResponse<List<PostListItemDto>>> GetRecentPostsAsync(string? language = null, int count = 10)
    {
        try
        {
            var posts = await context.Posts
                .Include(p => p.Author)
                .Include(p => p.Translations)
                .Where(p => p.Status == PostStatus.Published)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .ToListAsync();

            var postDtos = posts.Select(p => MapToPostListItemDto(p, language ?? "en")).ToList();
            return ApiResponse<List<PostListItemDto>>.SuccessResponse(postDtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving recent posts");
            return ApiResponse<List<PostListItemDto>>.ErrorResponse("An error occurred while retrieving recent posts.");
        }
    }

    public async Task<ApiResponse<PaginatedResponse<PostListItemDto>>> SearchPostsAsync(string searchTerm,
        PostQueryParameters parameters)
    {
        try
        {
            parameters.Search = searchTerm;
            return await GetPostsAsync(parameters);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error searching posts");
            return ApiResponse<PaginatedResponse<PostListItemDto>>.ErrorResponse(
                "An error occurred while searching posts.");
        }
    }

    private PostResponseDto MapToPostResponseDto(Post post)
    {
        return new PostResponseDto
        {
            Id = post.Id,
            AuthorId = post.AuthorId,
            Slug = post.Slug,
            FeaturedImageUrl = post.FeaturedImageUrl,
            Status = post.Status,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            PublishedAt = post.PublishedAt,
            ViewCount = post.ViewCount,
            IsFeatured = post.IsFeatured,
            Translations = post.Translations.Select(t => new PostTranslationResponseDto
            {
                Id = t.Id,
                LanguageCode = t.LanguageCode,
                Title = t.Title,
                Content = t.Content,
                Summary = t.Summary,
                MetaTitle = t.MetaTitle,
                MetaDescription = t.MetaDescription,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToList()
        };
    }

    private PostListItemDto MapToPostListItemDto(Post post, string language)
    {
        var translation = post.Translations.FirstOrDefault(t => t.LanguageCode == language)
                          ?? post.Translations.FirstOrDefault();

        return new PostListItemDto
        {
            Id = post.Id,
            Slug = post.Slug,
            FeaturedImageUrl = post.FeaturedImageUrl,
            Status = post.Status,
            CreatedAt = post.CreatedAt,
            PublishedAt = post.PublishedAt,
            ViewCount = post.ViewCount,
            IsFeatured = post.IsFeatured,
            Title = translation?.Title ?? "",
            Summary = translation?.Summary,
        };
    }
}