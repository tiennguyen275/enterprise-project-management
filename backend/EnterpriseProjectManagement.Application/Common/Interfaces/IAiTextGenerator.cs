namespace EnterpriseProjectManagement.Application.Common.Interfaces;

public interface IAiTextGenerator
{
    Task<string> GenerateAsync(
        string systemInstruction,
        string prompt,
        bool expectJson = false,
        CancellationToken cancellationToken = default);
}
