using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Daycare.Domain.Constants;
using Daycare.Infrastructure.Configuration;
using Daycare.Infrastructure.Identity;
using Daycare.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace Daycare.Application.Tests;

public class TokenServiceTests
{
    private readonly TokenService _tokenService;

    public TokenServiceTests()
    {
        var options = Options.Create(new JwtSettings
        {
            Secret = "SuperSecretKeyForTestingTokensWithSufficientLength123!",
            Issuer = "DaycareTestIssuer",
            Audience = "DaycareTestAudience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        });

        _tokenService = new TokenService(options);
    }

    [Fact]
    public void GenerateAccessToken_ContainsExpectedClaimsAndExpiration()
    {
        var userId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "teacher@daycare.local",
            FirstName = "Maria",
            LastName = "Garcia",
            StaffId = staffId
        };

        var (tokenString, expiresAt) = _tokenService.GenerateAccessToken(user, Roles.Staff);

        Assert.NotNull(tokenString);
        Assert.True(expiresAt > DateTime.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenString);

        Assert.Equal("DaycareTestIssuer", jwt.Issuer);
        Assert.Contains(jwt.Audiences, a => a == "DaycareTestAudience");
        Assert.Equal(userId.ToString(), jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal("teacher@daycare.local", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal(Roles.Staff, jwt.Claims.First(c => c.Type == "role" || c.Type == ClaimTypes.Role).Value);
        Assert.Equal(staffId.ToString(), jwt.Claims.First(c => c.Type == "staff_id").Value);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsActiveTokenWithCorrectExpiration()
    {
        var userId = Guid.NewGuid();
        var refreshToken = _tokenService.GenerateRefreshToken(userId);

        Assert.NotNull(refreshToken);
        Assert.Equal(userId, refreshToken.UserId);
        Assert.False(string.IsNullOrWhiteSpace(refreshToken.Token));
        Assert.True(refreshToken.IsActive);
        Assert.False(refreshToken.IsExpired);
        Assert.False(refreshToken.IsRevoked);
        Assert.True(refreshToken.ExpiresAt > DateTime.UtcNow.AddDays(6));
    }
}
