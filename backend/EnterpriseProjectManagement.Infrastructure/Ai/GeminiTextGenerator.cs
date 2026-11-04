using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using EnterpriseProjectManagement.Application.Common.Exceptions;
using EnterpriseProjectManagement.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace EnterpriseProjectManagement.Infrastructure.Ai;

public class GeminiTextGenerator : IAiTextGenerator
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;

    public GeminiTextGenerator(HttpClient httpClient, IOptions<GeminiSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<string> GenerateAsync(
        string systemInstruction,
        string prompt,
        bool expectJson = false,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new AiUnavailableException("Chưa cấu hình khóa API Gemini cho tính năng AI.");
        }

        var url = $"{_settings.BaseUrl.TrimEnd('/')}/models/{_settings.Model}:generateContent";

        var payload = new GeminiRequest
        {
            SystemInstruction = new GeminiContent { Parts = [new GeminiPart { Text = systemInstruction }] },
            Contents = [new GeminiContent { Role = "user", Parts = [new GeminiPart { Text = prompt }] }],
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = 0.4,
                ResponseMimeType = expectJson ? "application/json" : null
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("x-goog-api-key", _settings.ApiKey);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new AiUnavailableException("Không kết nối được dịch vụ AI.", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new AiUnavailableException("Dịch vụ AI phản hồi quá lâu.", ex);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new AiUnavailableException($"Dịch vụ AI trả về lỗi {(int)response.StatusCode}.");
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken);
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(text))
            {
                throw new AiUnavailableException("Dịch vụ AI không trả về nội dung.");
            }

            return text;
        }
    }

    private sealed class GeminiRequest
    {
        [JsonPropertyName("system_instruction")]
        public GeminiContent? SystemInstruction { get; set; }

        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("generationConfig")]
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    private sealed class GeminiContent
    {
        [JsonPropertyName("role")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Role { get; set; }

        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    private sealed class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    private sealed class GeminiGenerationConfig
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [JsonPropertyName("responseMimeType")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ResponseMimeType { get; set; }
    }

    private sealed class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
}
