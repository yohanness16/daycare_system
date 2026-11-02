using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Daycare.Application.DTOs.Common;
using Daycare.Domain.Exceptions;

namespace Daycare.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        context.Response.Headers["X-Trace-Id"] = traceId;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during request execution: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex, traceId);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, string traceId)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            DaycareApiException apiEx => new ApiErrorResponse
            {
                Status = apiEx.StatusCode,
                Title = apiEx.Title,
                Detail = apiEx.Message,
                Code = apiEx.Code,
                Errors = apiEx.Errors,
                Dependents = apiEx.Dependents,
                RetryAfterSeconds = apiEx.RetryAfterSeconds,
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            KeyNotFoundException notFoundEx => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.NotFound,
                Title = "Resource Not Found",
                Detail = notFoundEx.Message,
                Code = "NOT_FOUND",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            ArgumentNullException argNullEx => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Bad Request",
                Detail = argNullEx.Message,
                Code = "VALIDATION_FAILED",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            ArgumentException argEx => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Bad Request",
                Detail = argEx.Message,
                Code = "VALIDATION_FAILED",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            InvalidOperationException invEx => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Invalid Operation",
                Detail = invEx.Message,
                Code = "INVALID_OPERATION",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            UnauthorizedAccessException unauthEx => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.Unauthorized,
                Title = "Unauthorized",
                Detail = unauthEx.Message,
                Code = "INVALID_CREDENTIALS",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            },
            _ => new ApiErrorResponse
            {
                Status = (int)HttpStatusCode.InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred.",
                Code = "INTERNAL_SERVER_ERROR",
                TraceId = traceId,
                Timestamp = DateTime.UtcNow
            }
        };

        context.Response.StatusCode = response.Status;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        await context.Response.WriteAsync(json);
    }
}

