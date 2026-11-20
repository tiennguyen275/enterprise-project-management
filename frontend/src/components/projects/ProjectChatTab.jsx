import React from 'react';
import FormattedAiText from '../common/FormattedAiText';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

export default function ProjectChatTab({
  currentUser,
  signalRConnected,
  chatLoading,
  chatMessages,
  aiThinking,
  chatBottomRef,
  chatInput,
  setChatInput,
  chatSending,
  onSendMessage,
}) {
  return (
    <div className="project-chat-wrapper">
      <div className="chat-header">
        <div className="chat-header-title">
          <ForumOutlinedIcon style={{ color: '#4f46e5' }} />
          <div>
            <h3>Phòng Trao Đổi Dự Án & Trợ Lý AI Gemini</h3>
            <p>Trò chuyện thời gian thực qua SignalR và trao đổi thông minh cùng trợ lý AI</p>
          </div>
        </div>
        <div className="realtime-status-pill">
          <span className="pulse-dot" />
          <span>{signalRConnected ? 'Kết nối SignalR trực tuyến' : 'Đang kết nối...'}</span>
        </div>
      </div>

      <div className="chat-quick-actions">
        <span className="quick-title">Gợi ý câu hỏi AI:</span>
        <button
          type="button"
          className="quick-pill"
          onClick={() => onSendMessage(null, true, '@ai Tóm tắt tiến độ hiện tại và các điểm nghẽn chính')}
        >
          <AutoAwesomeOutlinedIcon style={{ fontSize: 13 }} />
          <span>@ai Tóm tắt tiến độ</span>
        </button>
        <button
          type="button"
          className="quick-pill"
          onClick={() => onSendMessage(null, true, '@ai Rủi ro lớn nhất và giải pháp khắc phục là gì?')}
        >
          <AutoAwesomeOutlinedIcon style={{ fontSize: 13 }} />
          <span>@ai Phân tích rủi ro</span>
        </button>
        <button
          type="button"
          className="quick-pill"
          onClick={() => onSendMessage(null, true, '@ai Đề xuất phân công và giải pháp tăng tốc dự án')}
        >
          <AutoAwesomeOutlinedIcon style={{ fontSize: 13 }} />
          <span>@ai Gợi ý tăng tốc</span>
        </button>
      </div>

      <div className="chat-messages-scroll">
        {chatLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '2rem 0' }}>Đang tải lịch sử trao đổi...</p>
        ) : chatMessages.length === 0 ? (
          <div className="empty-chat">
            <ForumOutlinedIcon style={{ fontSize: 48 }} />
            <h4>Chưa có trao đổi nào trong dự án</h4>
            <p>Gửi tin nhắn đầu tiên để cùng thảo luận, hoặc bấm &ldquo;Hỏi AI&rdquo; để nhận tư vấn dự án từ Gemini!</p>
          </div>
        ) : (
          chatMessages.map((m) => {
            const isSelf = currentUser && m.senderId === currentUser.id;
            const rowClass = m.isAiGenerated
              ? 'ai-message'
              : isSelf
              ? 'self-message'
              : 'user-message';

            return (
              <div key={m.id} className={`chat-bubble-row ${rowClass}`}>
                <div className="avatar-box">
                  {m.isAiGenerated ? (
                    <AutoAwesomeOutlinedIcon style={{ fontSize: 18 }} />
                  ) : (
                    (m.senderName || 'U').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="bubble-body">
                  <div className="sender-meta">
                    <span>{m.senderName}</span>
                    {m.isAiGenerated && (
                      <span className="ai-badge">
                        <AutoAwesomeOutlinedIcon style={{ fontSize: 11 }} /> AI Assistant
                      </span>
                    )}
                    <span className="time-label">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="message-text">
                    <FormattedAiText content={m.content} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        {aiThinking && (
          <div className="chat-bubble-row ai-message ai-typing-row">
            <div className="avatar-box">
              <AutoAwesomeOutlinedIcon className="pulse-ai-icon" style={{ fontSize: 18 }} />
            </div>
            <div className="bubble-body">
              <div className="sender-meta">
                <span>Trợ lý AI Gemini</span>
                <span className="ai-badge">
                  <AutoAwesomeOutlinedIcon style={{ fontSize: 11 }} /> Đang phản hồi...
                </span>
              </div>
              <div className="ai-typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-text">Trợ lý AI đang phân tích dữ liệu dự án...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      <div className="chat-composer-area">
        <form className="composer-form" onSubmit={(e) => onSendMessage(e, false)}>
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập tin nhắn thảo luận (gõ @ai để hỏi trợ lý Gemini)..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatSending}
          />
          <button
            type="button"
            className="btn-ask-ai"
            disabled={chatSending || !chatInput.trim()}
            onClick={(e) => onSendMessage(e, true)}
            title="Gửi kèm yêu cầu Trợ lý AI phân tích"
          >
            <AutoAwesomeOutlinedIcon style={{ fontSize: 15 }} />
            <span>Hỏi AI</span>
          </button>
          <button
            type="submit"
            className="btn-send-message"
            disabled={chatSending || !chatInput.trim()}
          >
            <SendOutlinedIcon style={{ fontSize: 16 }} />
            <span>{chatSending ? 'Đang gửi...' : 'Gửi'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
