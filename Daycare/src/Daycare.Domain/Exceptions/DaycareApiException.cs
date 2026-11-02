namespace Daycare.Domain.Exceptions;

public class DaycareApiException : Exception
{
    public int StatusCode { get; }
    public string Title { get; }
    public string Code { get; }
    public IDictionary<string, string[]>? Errors { get; }
    public object? Dependents { get; }
    public int? RetryAfterSeconds { get; }

    public DaycareApiException(
        int statusCode,
        string title,
        string message,
        string code,
        IDictionary<string, string[]>? errors = null,
        object? dependents = null,
        int? retryAfterSeconds = null)
        : base(message)
    {
        StatusCode = statusCode;
        Title = title;
        Code = code;
        Errors = errors;
        Dependents = dependents;
        RetryAfterSeconds = retryAfterSeconds;
    }
}

public class HasDependentsException : DaycareApiException
{
    public HasDependentsException(string message, object dependents)
        : base(409, "Conflict", message, "HAS_DEPENDENTS", dependents: dependents)
    {
    }
}

public class AccountLockedException : DaycareApiException
{
    public AccountLockedException(string message, int retryAfterSeconds)
        : base(423, "Locked", message, "ACCOUNT_LOCKED", retryAfterSeconds: retryAfterSeconds)
    {
    }
}

public class AccountDisabledException : DaycareApiException
{
    public AccountDisabledException(string message = "This account has been deactivated.")
        : base(401, "Unauthorized", message, "ACCOUNT_DISABLED")
    {
    }
}

public class PasswordPolicyException : DaycareApiException
{
    public PasswordPolicyException(string message, IDictionary<string, string[]> errors)
        : base(400, "Bad Request", message, "PASSWORD_POLICY", errors: errors)
    {
    }
}
