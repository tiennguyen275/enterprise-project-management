import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';

export default function MeetingNotesTab({ notes, onOpenNoteModal, onDeleteNote }) {
  return (
    <div className="notes-layout">
      <div className="notes-header">
        <div>
          <h3>Nhật Ký & Biên Bản Cuộc Họp Dự Án</h3>
          <p>Lưu vết các quyết định quan trọng và phân công hành động (Action Items)</p>
        </div>
        <button onClick={onOpenNoteModal} className="btn-primary">
          <AddIcon fontSize="small" />
          <span>Ghi Biên Bản Mới</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <DescriptionOutlinedIcon style={{ fontSize: 60, color: '#94a3b8' }} />
          <h3>Chưa có biên bản cuộc họp nào</h3>
          <p>Lưu lại nội dung cuộc họp để cả nhóm cùng theo dõi</p>
          <button onClick={onOpenNoteModal} className="btn-primary">
            <AddIcon fontSize="small" />
            <span>Tạo Biên Bản Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-card-header">
                <h4>{note.title}</h4>
                <button onClick={() => onDeleteNote(note.id)} className="btn-delete" title="Xóa">
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </button>
              </div>
              <div className="note-meta">
                <span><CalendarTodayOutlinedIcon style={{ fontSize: 14 }} /> {new Date(note.meetingDate).toLocaleDateString('vi-VN')}</span>
                {note.attendees && <span><PeopleAltOutlinedIcon style={{ fontSize: 14 }} /> {note.attendees}</span>}
              </div>
              <div className="note-content">
                <p>{note.content}</p>
              </div>
              {note.actionItems && (
                <div className="note-action-items">
                  <strong>Hạng mục hành động:</strong>
                  <p>{note.actionItems}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
