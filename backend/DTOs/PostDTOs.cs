using NewsManagementAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace NewsManagementAPI.DTOs;


public class CreatePostRequestDto
{
    [Required]
    [StringLength(255)]
    public string Slug { get; set; } = string.Empty;

    public string? FeaturedImageUrl { get; set; }

    [Required]
    public PostStatus Status { get; set; } = PostStatus.Draft;

    public DateTime? PublishedAt { get; set; }

    public bool IsFeatured { get; set; } = false;

    [Required]
    public List<CreatePostTranslationDto> Translations { get; set; } = new();
}


public class UpdatePostRequestDto
{
    [StringLength(255)]
    public string? Slug { get; set; }

    public string? FeaturedImageUrl { get; set; }

    public PostStatus? Status { get; set; }

    public DateTime? PublishedAt { get; set; }

    public bool? IsFeatured { get; set; }

    public List<UpdatePostTranslationDto>? Translations { get; set; }
}


public class CreatePostTranslationDto
{
    [Required]
    [StringLength(2)]
    public string LanguageCode { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Summary { get; set; }

    [StringLength(500)]
    public string? MetaTitle { get; set; }

    [StringLength(1000)]
    public string? MetaDescription { get; set; }
}


public class UpdatePostTranslationDto
{
    public int? Id { get; set; }

    [Required]
    [StringLength(2)]
    public string LanguageCode { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Title { get; set; }

    public string? Content { get; set; }

    [StringLength(1000)]
    public string? Summary { get; set; }

    [StringLength(500)]
    public string? MetaTitle { get; set; }

    [StringLength(1000)]
    public string? MetaDescription { get; set; }
}


public class PostResponseDto
{
    public int Id { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public PostStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public List<PostTranslationResponseDto> Translations { get; set; } = new();
}

public class PostTranslationResponseDto
{
    public int Id { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}


public class PostListItemDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public PostStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
}