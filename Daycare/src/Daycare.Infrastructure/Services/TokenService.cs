using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Daycare.Domain.Entities;
using Daycare.Infrastructure.Configuration;
using Daycare.Infrastructure.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Daycare.Infrastructure.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) GenerateAccessToken(ApplicationUser user, string role);

    RefreshToken GenerateRefreshToken(Guid userId);
}

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;

    public TokenService(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        if (string.IsNullOrWhiteSpace(_jwtSettings.Secret))
        {
            throw new ArgumentException("JWT Secret is not configured.", nameof(jwtOptions));
        }
    }

    public (string Token, DateTime ExpiresAt) GenerateAccessToken(ApplicationUser user, string role)
    {
        ArgumentNullException.ThrowIfNull(user);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Role, role)
        };

        if (user.StaffId.HasValue)
        {
            claims.Add(new Claim("staff_id", user.StaffId.Value.ToString()));
        }

        if (user.GuardianId.HasValue)
        {
            claims.Add(new Claim("guardian_id", user.GuardianId.Value.ToString()));
        }

        if (user.ChildId.HasValue)
        {
            claims.Add(new Claim("child_id", user.ChildId.Value.ToString()));
        }

        claims.Add(new Claim("must_change_password", user.MustChangePassword ? "true" : "false"));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return (tokenHandler.WriteToken(token), expiresAt);
    }

    public RefreshToken GenerateRefreshToken(Guid userId)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = Convert.ToBase64String(randomBytes),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        };
    }
}
