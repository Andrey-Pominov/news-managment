using NewsManagementAPI.DTOs;

namespace NewsManagementAPI.Services;


public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request);
    
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken);
    
    Task<ApiResponse<bool>> RevokeTokenAsync(string refreshToken);
    
    Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequestDto request);
    
    Task<ApiResponse<AuthResponseDto>> ValidateTokenAsync(string token);
    
    Task<ApiResponse<bool>> LogoutAsync(string userId);
}