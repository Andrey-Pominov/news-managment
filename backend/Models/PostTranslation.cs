using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NewsManagementAPI.Models;

public class PostTranslation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(PostId))]
    public virtual Post Post { get; set; } = null!;
}