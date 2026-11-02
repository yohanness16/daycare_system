using Daycare.Application.DTOs.Common;
using Daycare.Application.DTOs.Media;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf"
    };

    private const long MaxFileSizeInBytes = 25 * 1024 * 1024; // 25 MB

    private readonly IWebHostEnvironment _environment;

    public MediaController(IWebHostEnvironment environment)
    {
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MediaUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ApiErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Failed",
                Detail = "A valid file is required.",
                Code = "FILE_EMPTY",
                TraceId = HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            });
        }

        if (file.Length > MaxFileSizeInBytes)
        {
            return BadRequest(new ApiErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Failed",
                Detail = $"File size exceeds maximum allowed size of {MaxFileSizeInBytes / (1024 * 1024)}MB.",
                Code = "FILE_TOO_LARGE",
                TraceId = HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            return BadRequest(new ApiErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Unsupported Media Type",
                Detail = $"File extension '{extension}' is not allowed. Supported formats: .jpg, .jpeg, .png, .webp, .pdf.",
                Code = "INVALID_FILE_TYPE",
                TraceId = HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            });
        }

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileId = Guid.NewGuid();
        var storedFileName = $"{fileId}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsFolder, storedFileName);

        await using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(fileStream, cancellationToken);
        }

        var response = new MediaUploadResponse
        {
            Id = fileId,
            Url = $"/uploads/{storedFileName}",
            FileName = file.FileName,
            FileSize = file.Length,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType
        };

        return Ok(response);
    }
}
