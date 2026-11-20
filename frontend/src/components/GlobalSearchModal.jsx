import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserAvatar from './UserAvatar';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

const RECENT_STORAGE_KEY = 'epms_recent_searches';

const TASK_STATUS_LABEL = {
  1: 'Cần làm',
  2: 'Đang làm',
  3: 'Chờ duyệt',
  4: 'Hoàn thành',
};

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  const cleaned = term.trim();
  if (!cleaned) return loadRecentSearches();
  const prev = loadRecentSearches().filter((x) => x.toLowerCase() !== cleaned.toLowerCase());
  const next = [cleaned, ...prev].slice(0, 5);
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export default function GlobalSearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], users: [] });
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (!trimmed) {
      return undefined;
    }

    let isActive = true;
    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/search', { params: { q: trimmed, limit: 6 } })
        .then((res) => {
          if (isActive) {
            setResults(res.data || { projects: [], tasks: [], users: [] });
            setActiveIndex(0);
          }
        })
        .catch((err) => {
          console.error('Lỗi tìm kiếm toàn cục:', err);
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });
    }, 180);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  const flatItems = useMemo(() => {
    if (!query.trim()) return [];
    const list = [];
    for (const p of results.projects || []) {
      list.push({ type: 'project', key: `p-${p.id}`, data: p });
    }
    for (const t of results.tasks || []) {
      list.push({ type: 'task', key: `t-${t.id}`, data: t });
    }
    for (const u of results.users || []) {
      list.push({ type: 'user', key: `u-${u.id}`, data: u });
    }
    return list;
  }, [query, results]);

  const handleSelectItem = (item) => {
    if (query.trim()) {
      setRecentSearches(saveRecentSearch(query));
    }
    onClose();
    if (item.type === 'project') {
      navigate(`/projects/${item.data.id}`);
    } else if (item.type === 'task') {
      navigate(`/projects/${item.data.projectId}?taskId=${item.data.id}`);
    } else if (item.type === 'user') {
      navigate(`/users?q=${encodeURIComponent(item.data.fullName)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatItems[activeIndex];
      if (target) handleSelectItem(target);
    }
  };

  const handleClearRecent = () => {
    localStorage.removeItem(RECENT_STORAGE_KEY);
    setRecentSearches([]);
  };

  if (!open) return null;

  const hasQuery = Boolean(query.trim());
  const projectStart = 0;
  const taskStart = (results.projects || []).length;
  const userStart = taskStart + (results.tasks || []).length;

  return (
    <div className="global-search-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="global-search-modal" role="dialog" aria-modal="true" aria-label="Tìm kiếm toàn cục">
        <div className="global-search-input-row">
          <SearchIcon className="global-search-icon" fontSize="small" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setResults({ projects: [], tasks: [], users: [] });
                setLoading(false);
                setActiveIndex(0);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm dự án, mã công việc, nhân sự (hỗ trợ không dấu)..."
          />
          {query && (
            <button
              type="button"
              className="btn-clear-query"
              onClick={() => {
                setQuery('');
                setResults({ projects: [], tasks: [], users: [] });
                setLoading(false);
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              title="Xóa từ khóa"
            >
              <CloseIcon style={{ fontSize: 16 }} />
            </button>
          )}
          <kbd className="esc-kbd">ESC</kbd>
        </div>

        <div className="global-search-body">
          {!hasQuery ? (
            <div className="search-idle-state">
              {recentSearches.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <span>Tìm kiếm gần đây</span>
                    <button type="button" className="btn-clear-recent" onClick={handleClearRecent}>
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="recent-chips">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="recent-chip"
                        onClick={() => setQuery(term)}
                      >
                        <HistoryIcon style={{ fontSize: 14 }} />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-section">
                <div className="search-section-header">
                  <span>Đi tới nhanh</span>
                </div>
                <div className="quick-nav-list">
                  <button type="button" className="quick-nav-item" onClick={() => { onClose(); navigate('/'); }}>
                    <FolderSpecialOutlinedIcon style={{ fontSize: 18, color: '#0284c7' }} />
                    <span>Danh sách Dự án (Dashboard)</span>
                  </button>
                  <button type="button" className="quick-nav-item" onClick={() => { onClose(); navigate('/my-tasks'); }}>
                    <AssignmentOutlinedIcon style={{ fontSize: 18, color: '#6366f1' }} />
                    <span>Công việc của tôi (My Tasks)</span>
                  </button>
                  <button type="button" className="quick-nav-item" onClick={() => { onClose(); navigate('/users'); }}>
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 18, color: '#8b5cf6' }} />
                    <span>Danh bạ Nhân sự</span>
                  </button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="search-empty-state">Đang tìm kiếm trong hệ thống...</div>
          ) : flatItems.length === 0 ? (
            <div className="search-empty-state">
              Không tìm thấy kết quả nào khớp với <strong>&ldquo;{query}&rdquo;</strong>
            </div>
          ) : (
            <>
              {(results.projects || []).length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <span>Dự án ({results.projects.length})</span>
                  </div>
                  {results.projects.map((p, idx) => {
                    const globalIdx = projectStart + idx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`search-hit-item ${activeIndex === globalIdx ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => handleSelectItem({ type: 'project', data: p })}
                      >
                        <span className="hit-icon icon-project">
                          <FolderSpecialOutlinedIcon style={{ fontSize: 17 }} />
                        </span>
                        <span className="hit-main">
                          <span className="hit-title-row">
                            <span className="hit-code">{p.code}</span>
                            <span className="hit-title">{p.name}</span>
                          </span>
                          {p.description && <span className="hit-sub">{p.description}</span>}
                        </span>
                        <KeyboardReturnIcon className="hit-enter-icon" style={{ fontSize: 15 }} />
                      </button>
                    );
                  })}
                </div>
              )}

              {(results.tasks || []).length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <span>Công việc ({results.tasks.length})</span>
                  </div>
                  {results.tasks.map((t, idx) => {
                    const globalIdx = taskStart + idx;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`search-hit-item ${activeIndex === globalIdx ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => handleSelectItem({ type: 'task', data: t })}
                      >
                        <span className="hit-icon icon-task">
                          <AssignmentOutlinedIcon style={{ fontSize: 17 }} />
                        </span>
                        <span className="hit-main">
                          <span className="hit-title-row">
                            <span className="hit-code">{t.taskCode}</span>
                            <span className="hit-title">{t.title}</span>
                          </span>
                          <span className="hit-sub">
                            {TASK_STATUS_LABEL[t.status] || 'Công việc'}
                            {t.assigneeName ? ` · ${t.assigneeName}` : ' · Chưa phân công'}
                          </span>
                        </span>
                        {t.assigneeName && (
                          <UserAvatar name={t.assigneeName} avatarUrl={t.assigneeAvatarUrl} size="xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {(results.users || []).length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <span>Nhân sự ({results.users.length})</span>
                  </div>
                  {results.users.map((u, idx) => {
                    const globalIdx = userStart + idx;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`search-hit-item ${activeIndex === globalIdx ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => handleSelectItem({ type: 'user', data: u })}
                      >
                        <UserAvatar name={u.fullName} email={u.email} avatarUrl={u.avatarUrl} size="sm" />
                        <span className="hit-main">
                          <span className="hit-title-row">
                            <span className="hit-title">{u.fullName}</span>
                            {u.systemRole === 'Admin' && <span className="hit-role-admin">Admin</span>}
                          </span>
                          <span className="hit-sub">{u.email}</span>
                        </span>
                        <KeyboardReturnIcon className="hit-enter-icon" style={{ fontSize: 15 }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="global-search-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Di chuyển</span>
          <span><kbd>Enter</kbd> Mở mục đang chọn</span>
          <span><kbd>Esc</kbd> Đóng</span>
        </div>
      </div>
    </div>
  );
}

