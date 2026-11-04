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
                "Phân tích yêu cầu và đặc tả kỹ thuật",
                "Thiết kế kiến trúc và xây dựng luồng xử lý",
                "Hiện thực hóa mã nguồn và xử lý các ca biên",
                "Kiểm thử chức năng và nghiệm thu"
            });
        }

        if (prompt.Contains("Hãy viết nhận xét về tình hình dự án gồm 3 phần ngắn"))
        {
            return "(Chế độ AI Heuristic Nội bộ)\n\n"
                + "1. Đánh giá chung: Dự án đang duy trì tiến độ thực thi với các đầu mục công việc được số hóa rõ ràng.\n\n"
                + "2. Rủi ro chính: Các công việc cận hạn và khối lượng đang thực hiện cần được giám sát chặt chẽ để tránh dồn ứ cuối kỳ.\n\n"
                + "3. Việc nên làm ngay: Tập trung dứt điểm các công việc đang ở trạng thái 'Đang làm', phân bổ lại tải cho các thành viên có năng lực nhàn rỗi và cập nhật tiến độ đều đặn.";
        }

        var lower = prompt.ToLowerInvariant();
        var questionPart = lower;
        var marker = "câu hỏi vào phòng chat dự án: \"";
        var markerIdx = lower.IndexOf(marker, StringComparison.Ordinal);
        if (markerIdx >= 0)
        {
            var startIdx = markerIdx + marker.Length;
            var endQuoteIdx = lower.IndexOf('"', startIdx);
            questionPart = endQuoteIdx > startIdx 
                ? lower.Substring(startIdx, endQuoteIdx - startIdx) 
                : lower.Substring(startIdx);
        }

        if (questionPart.Contains("rủi ro") || questionPart.Contains("nguy cơ") || questionPart.Contains("điểm nghẽn") || questionPart.Contains("khắc phục"))
        {
            return "(Chế độ AI Heuristic Nội bộ)\n\n"
                + "Chào bạn! Phân tích rủi ro và giải pháp khắc phục cho dự án:\n"
                + "1. Rủi ro trễ hạn đường găng: Các công việc có độ trôi (Total Float) bằng 0 ngày bắt buộc phải đúng hạn, vì bất kỳ sự chậm trễ nào ở nhánh này sẽ làm lùi ngày hoàn thành toàn dự án.\n"
                + "2. Rủi ro dồn ứ: Cần tránh để quá nhiều việc cùng ở trạng thái 'Đang làm' dẫn đến phân tán nguồn lực.\n"
                + "3. Giải pháp: Thảo luận nhanh đầu ngày (Daily Standup) và cập nhật thường xuyên bảng Kanban để phát hiện sớm các mắt xích bị nghẽn.";
        }

        if (questionPart.Contains("phân công") || questionPart.Contains("tăng tốc") || questionPart.Contains("nhân sự") || questionPart.Contains("phân bổ") || questionPart.Contains("tải"))
        {
            return "(Chế độ AI Heuristic Nội bộ)\n\n"
                + "Chào bạn! Để tối ưu phân công và tăng tốc tiến độ cho dự án:\n"
                + "1. Cân bằng tải công việc: Sử dụng tính năng xếp hạng phân bổ để chuyển bớt đầu việc cho những thành viên có tải nhẹ hơn, giảm áp lực cục bộ.\n"
                + "2. Giới hạn công việc đang làm (WIP): Tập trung hoàn thành dứt điểm các thẻ đang ở cột 'Đang làm' trước khi mở thêm việc mới nhằm rút ngắn chu kỳ thực hiện.\n"
                + "3. Tập trung vào đường găng: Ưu tiên tối đa cho các công việc thuộc Đường găng (CPM) và xử lý dứt điểm các công việc có nguy cơ quá hạn.";
        }

        if (questionPart.Contains("tiến độ") || questionPart.Contains("tóm tắt") || questionPart.Contains("tình hình") || questionPart.Contains("hiện trạng"))
        {
            return "(Chế độ AI Heuristic Nội bộ)\n\n"
                + "Chào bạn! Tóm tắt hiện trạng tiến độ dự án:\n"
                + "- Dự án đang được theo dõi trên bảng Kanban và sơ đồ Gantt đường găng (CPM).\n"
                + "- Trọng tâm cần làm: Đẩy nhanh các công việc đang ở giai đoạn 'Chờ duyệt' và 'Đang làm' để đưa về đích đúng kế hoạch.\n"
                + "- Đề xuất: Đảm bảo các ràng buộc thứ tự (Finish-to-Start) được hoàn tất đúng hạn để các công việc tiếp theo có thể khởi động ngay.";
        }

        return "(Chế độ AI Heuristic Nội bộ)\n\n"
            + "Chào bạn! Trợ lý AI đã ghi nhận yêu cầu của bạn. Nhóm nên duy trì cập nhật bảng Kanban, trao đổi các vướng mắc trực tiếp trong phòng chat này và theo dõi sát sao tiến độ trên biểu đồ đường găng CPM để dự án về đích thành công.";
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
