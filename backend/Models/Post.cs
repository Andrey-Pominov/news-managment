using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NewsManagementAPI.Models;

public class Post
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(450)]
    public string AuthorId { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string Slug { get; set; } = string.Empty;
    
    [Required]
    public PostStatus Status { get; set; } = PostStatus.Draft;


    public string? FeaturedImageUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }

    public int ViewCount { get; set; } = 0;
    public bool IsFeatured { get; set; } = false;

    [ForeignKey(nameof(AuthorId))]
    public virtual ApplicationUser Author { get; set; } = null!;

    public virtual ICollection<PostTranslation> Translations { get; set; } = new List<PostTranslation>();
}