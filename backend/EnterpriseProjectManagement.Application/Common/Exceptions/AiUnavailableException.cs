namespace EnterpriseProjectManagement.Application.Common.Exceptions;

public class AiUnavailableException : Exception
{
    public AiUnavailableException(string message) : base(message)
    {
    }

    public AiUnavailableException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
