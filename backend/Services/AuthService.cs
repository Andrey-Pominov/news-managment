using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NewsManagementAPI.Data;
using NewsManagementAPI.DTOs;
using NewsManagementAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace NewsManagementAPI.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ApplicationDbContext context,
    IConfiguration configuration,
    ILogger<AuthService> logger)
    : IAuthService
{
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        try
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is not { IsActive: true })
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid email or password.");
            }

            var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid email or password.");
            }

            user.LastLoginAt = DateTime.UtcNow;
            await userManager.UpdateAsync(user);

            var jwtToken = await GenerateJwtTokenAsync(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshTokens.Add(refreshToken);
            await context.SaveChangesAsync();

            var response = await CreateAuthResponseAsync(user, jwtToken, refreshToken.Token);

            logger.LogInformation("User {Email} logged in successfully.", request.Email);
            return ApiResponse<AuthResponseDto>.SuccessResponse(response, "Login successful.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during login for {Email}", request.Email);
            return ApiResponse<AuthResponseDto>.ErrorResponse("An error occurred during login.");
        }
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            if (await userManager.FindByEmailAsync(request.Email) != null)
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Email is already registered.");
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PreferredLanguage = request.PreferredLanguage,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return ApiResponse<AuthResponseDto>.ErrorResponse("Registration failed.", errors);
            }

            await userManager.AddToRoleAsync(user, "User");

            var jwtToken = await GenerateJwtTokenAsync(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshTokens.Add(refreshToken);
            await context.SaveChangesAsync();

            var response = await CreateAuthResponseAsync(user, jwtToken, refreshToken.Token);

            logger.LogInformation("User {Email} registered successfully.", request.Email);
            return ApiResponse<AuthResponseDto>.SuccessResponse(response, "Registration successful.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return ApiResponse<AuthResponseDto>.ErrorResponse("An error occurred during registration.");
        }
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var user = await GetUserByRefreshTokenAsync(refreshToken);
            if (user == null)
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid refresh token.");
            }

            var existingToken = user.RefreshTokens.SingleOrDefault(x => x.Token == refreshToken);
            if (existingToken == null || !existingToken.IsActive)
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid refresh token.");
            }

            existingToken.IsRevoked = true;
            existingToken.RevokedAt = DateTime.UtcNow;

            var newRefreshToken = GenerateRefreshToken();
            user.RefreshTokens.Add(newRefreshToken);

            await context.SaveChangesAsync();

            var jwtToken = await GenerateJwtTokenAsync(user);
            var response = await CreateAuthResponseAsync(user, jwtToken, newRefreshToken.Token);

            return ApiResponse<AuthResponseDto>.SuccessResponse(response, "Token refreshed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during token refresh");
            return ApiResponse<AuthResponseDto>.ErrorResponse("An error occurred during token refresh.");
        }
    }
    
    public async Task<ApiResponse<bool>> RevokeTokenAsync(string refreshToken)
    {
        try
        {
            var user = await GetUserByRefreshTokenAsync(refreshToken);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Invalid refresh token.");
            }

            var token = user.RefreshTokens.SingleOrDefault(x => x.Token == refreshToken);
            if (token is not { IsActive: true })
            {
                return ApiResponse<bool>.ErrorResponse("Invalid refresh token.");
            }

            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Token revoked successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during token revocation");
            return ApiResponse<bool>.ErrorResponse("An error occurred during token revocation.");
        }
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequestDto request)
    {
        try
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("User not found.");
            }

            var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return ApiResponse<bool>.ErrorResponse("Password change failed.", errors);
            }

            logger.LogInformation("Password changed for user {UserId}", userId);
            return ApiResponse<bool>.SuccessResponse(true, "Password changed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during password change for user {UserId}", userId);
            return ApiResponse<bool>.ErrorResponse("An error occurred during password change.");
        }
    }

    public async Task<ApiResponse<AuthResponseDto>> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(configuration["JwtSettings:SecretKey"]!);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = configuration["JwtSettings:Issuer"],
                ValidateAudience = true,
                ValidAudience = configuration["JwtSettings:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userId = jwtToken.Claims.First(x => x.Type == "id").Value;
            var user = await userManager.FindByIdAsync(userId);

            if (user == null || !user.IsActive)
            {
                return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid token.");
            }

            var response = await CreateAuthResponseAsync(user, token, string.Empty);
            return ApiResponse<AuthResponseDto>.SuccessResponse(response, "Token is valid.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during token validation");
            return ApiResponse<AuthResponseDto>.ErrorResponse("Invalid token.");
        }
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string userId)
    {
        try
        {
            var user = await context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("User not found.");
            }

            foreach (var token in user.RefreshTokens.Where(t => t.IsActive))
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();

            logger.LogInformation("User {UserId} logged out successfully", userId);
            return ApiResponse<bool>.SuccessResponse(true, "Logout successful.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during logout for user {UserId}", userId);
            return ApiResponse<bool>.ErrorResponse("An error occurred during logout.");
        }
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(configuration["JwtSettings:SecretKey"]!);
        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim("id", user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FirstName),
            new Claim("preferred_language", user.PreferredLanguage)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(int.Parse(configuration["JwtSettings:ExpirationInHours"]!)),
            Issuer = configuration["JwtSettings:Issuer"],
            Audience = configuration["JwtSettings:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private RefreshToken GenerateRefreshToken()
    {
        using var rngCryptoServiceProvider = RandomNumberGenerator.Create();
        var randomBytes = new byte[64];
        rngCryptoServiceProvider.GetBytes(randomBytes);

        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes),
            ExpiryDate = DateTime.UtcNow.AddDays(int.Parse(configuration["JwtSettings:RefreshTokenExpirationInDays"]!)),
        };
    }

    private async Task<ApplicationUser?> GetUserByRefreshTokenAsync(string token)
    {
        return await context.Users
            .Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));
    }

    private async Task<AuthResponseDto> CreateAuthResponseAsync(ApplicationUser user, string accessToken, string refreshToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(accessToken);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PreferredLanguage = user.PreferredLanguage,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = jwtToken.ValidTo,
            Roles = roles.ToList()
        };
    }
}