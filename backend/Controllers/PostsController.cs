using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsManagementAPI.DTOs;
using NewsManagementAPI.Services;

namespace NewsManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController(IPostService postService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostListItemDto>>>> GetPosts(
        [FromQuery] PostQueryParameters parameters)
    {
        var result = await postService.GetPostsAsync(parameters);
        return Ok(result);
    }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> GetPost(int id)
    {
        var result = await postService.GetPostByIdAsync(id);

        if (!result.Success)
        {
            return NotFound(result);
        }

        if (result.Data?.Status == Models.PostStatus.Published)
        {
            await postService.IncrementViewCountAsync(id);
        }

        return Ok(result);
    }


    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> GetPostBySlug(string slug,
        [FromQuery] string? language)
    {
        var result = await postService.GetPostBySlugAsync(slug, language);

        if (!result.Success)
        {
            return NotFound(result);
        }

        if (result.Data?.Status == Models.PostStatus.Published)
        {
            await postService.IncrementViewCountAsync(result.Data.Id);
        }

        return Ok(result);
    }


    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> CreatePost([FromBody] CreatePostRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<PostResponseDto>.ErrorResponse("Invalid input.", errors));
        }

        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<PostResponseDto>.ErrorResponse("User not found."));
        }

        var result = await postService.CreatePostAsync(request, userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetPost), new { id = result.Data!.Id }, result);
    }


    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> UpdatePost(int id,
        [FromBody] UpdatePostRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<PostResponseDto>.ErrorResponse("Invalid input.", errors));
        }

        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<PostResponseDto>.ErrorResponse("User not found."));
        }

        var result = await postService.UpdatePostAsync(id, request, userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }


    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePost(int id)
    {
        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<bool>.ErrorResponse("User not found."));
        }

        var result = await postService.DeletePostAsync(id, userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }


    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostListItemDto>>>> SearchPosts([FromQuery] string q,
        [FromQuery] PostQueryParameters parameters)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(
                ApiResponse<PaginatedResponse<PostListItemDto>>.ErrorResponse("Search query is required."));
        }

        var result = await postService.SearchPostsAsync(q, parameters);
        return Ok(result);
    }


    [HttpGet("author/{authorId}")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PostListItemDto>>>> GetPostsByAuthor(string authorId,
        [FromQuery] PostQueryParameters parameters)
    {
        parameters.AuthorId = authorId;
        var result = await postService.GetPostsAsync(parameters);
        return Ok(result);
    }
}