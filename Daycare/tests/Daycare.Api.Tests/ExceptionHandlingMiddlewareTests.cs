using Daycare.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using Xunit;

namespace Daycare.Api.Tests;

public class ExceptionHandlingMiddlewareTests
{
    private readonly NullLogger<ExceptionHandlingMiddleware> _logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

    [Fact]
    public async Task InvokeAsync_WhenNoException_DoesNotModifyResponse()
    {
        var context = new DefaultHttpContext();
        var wasNextCalled = false;

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            wasNextCalled = true;
            return Task.CompletedTask;
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.True(wasNextCalled);
        Assert.Equal(200, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundException_Returns404NotFoundJson()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new KeyNotFoundException("Child with id '123' was not found.");
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(404, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Resource Not Found", doc.RootElement.GetProperty("title").GetString());
        Assert.Contains("Child with id '123' was not found.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentException_Returns400BadRequestJson()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new ArgumentException("Invalid date range specified.");
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(400, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(400, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Bad Request", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal("Invalid date range specified.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenInvalidOperationException_Returns400BadRequestJson()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new InvalidOperationException("Child is already enrolled.");
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(400, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(400, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Invalid Operation", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal("Child is already enrolled.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessException_Returns401UnauthorizedJson()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new UnauthorizedAccessException("Invalid credentials provided.");
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(401, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(401, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Unauthorized", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal("Invalid credentials provided.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_Returns500InternalServerErrorJson()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new Exception("Database disk failure!");
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(500, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Internal Server Error", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal("An unexpected error occurred.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenHasDependentsException_Returns409ConflictWithDependentsAndCode()
    {
        var context = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            throw new Daycare.Domain.Exceptions.HasDependentsException(
                "Cannot delete guardian because children are registered under them.",
                new Dictionary<string, int> { { "children", 2 } });
        }, _logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(409, context.Response.StatusCode);
        Assert.True(context.Response.Headers.ContainsKey("X-Trace-Id"));

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Conflict", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal("HAS_DEPENDENTS", doc.RootElement.GetProperty("code").GetString());
        Assert.Equal(2, doc.RootElement.GetProperty("dependents").GetProperty("children").GetInt32());
    }
}
