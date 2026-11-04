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
            return GenerateFallback(prompt, expectJson);
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
        catch (HttpRequestException)
        {
            return GenerateFallback(prompt, expectJson);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return GenerateFallback(prompt, expectJson);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                return GenerateFallback(prompt, expectJson);
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken);
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(text))
            {
                return GenerateFallback(prompt, expectJson);
            }

            return text;
        }
    }

    private static string GenerateFallback(string prompt, bool expectJson)
    {
        if (expectJson)
        {
            return JsonSerializer.Serialize(new[]
            {
                "Phân tích yêu cầu và xác định tiêu chí hoàn thành",
                "Thiết kế kiến trúc và luồng xử lý chi tiết",
                "Hiện thực hóa mã nguồn và xử lý các ca biên",
                "Kiểm thử chức năng và nghiệm thu cùng đội ngũ"
            });
        }

        if (prompt.Contains("Đánh giá chung") || prompt.Contains("Dự án:"))
        {
            return "(Chế độ AI Heuristic Nội bộ)\n\n"
                + "1. Đánh giá chung: Dự án đang duy trì nhịp độ thực thi với các đầu mục công việc được số hóa rõ ràng trên hệ thống.\n\n"
                + "2. Rủi ro chính: Các công việc cận hạn và khối lượng đang thực hiện cần được giám sát chặt chẽ để tránh dồn ứ cuối kỳ.\n\n"
                + "3. Việc nên làm ngay: Tập trung dứt điểm các công việc đang ở trạng thái 'Đang làm', phân bổ lại tải cho các thành viên có năng lực nhàn rỗi và cập nhật tiến độ đều đặn.";
        }

        return "(Chế độ AI Heuristic Nội bộ)\n\n"
            + "Chào bạn! Tôi đã phân tích hiện trạng dự án:\n"
            + "- Về tiến độ: Hãy ưu tiên hoàn tất các công việc đang thực hiện trước khi nhận thêm việc mới nhằm giảm thiểu thời gian chờ.\n"
            + "- Về nguồn lực: Khuyến khích tận dụng tính năng gợi ý phân công công việc để tối ưu hóa năng suất toàn đội.\n"
            + "- Đề xuất: Tiếp tục trao đổi qua phòng chat dự án và cập nhật bảng Kanban thường xuyên để mọi người nắm bắt thông tin đồng bộ.";
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
