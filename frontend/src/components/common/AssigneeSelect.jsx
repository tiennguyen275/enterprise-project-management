import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

export default function AssigneeSelect({
  members = [],
  value = '',
  onChange,
  placeholder = 'Chưa chỉ định',
  extraOptions = [],
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const selectedMember = members.find((m) => m.userId === value);
  const selectedExtra = extraOptions.find((opt) => opt.value === value);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`assignee-select ${open ? 'is-open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="assignee-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="assignee-trigger-content">
          {selectedMember ? (
            <>
              <UserAvatar
                name={selectedMember.fullName}
                email={selectedMember.email}
                avatarUrl={selectedMember.avatarUrl}
                size="xs"
              />
              <span className="assignee-trigger-label">{selectedMember.fullName}</span>
            </>
          ) : (
            <>
              <span className="assignee-placeholder-icon">
                <PersonOutlineOutlinedIcon style={{ fontSize: 15 }} />
              </span>
              <span className="assignee-trigger-label is-placeholder">
                {selectedExtra ? selectedExtra.label : placeholder}
              </span>
            </>
          )}
        </span>
        <KeyboardArrowDownIcon className="assignee-chevron" style={{ fontSize: 18 }} />
      </button>

      {open && (
        <div className="assignee-select-menu" role="listbox">
          {extraOptions.length > 0 ? (
            extraOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`assignee-option ${value === opt.value ? 'is-selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="assignee-placeholder-icon">
                  <PersonOutlineOutlinedIcon style={{ fontSize: 15 }} />
                </span>
                <span className="assignee-option-info">
                  <span className="assignee-option-name">{opt.label}</span>
                </span>
                {value === opt.value && <CheckIcon className="assignee-option-check" style={{ fontSize: 16 }} />}
              </button>
            ))
          ) : (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`assignee-option ${!value ? 'is-selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span className="assignee-placeholder-icon">
                <PersonOutlineOutlinedIcon style={{ fontSize: 15 }} />
              </span>
              <span className="assignee-option-info">
                <span className="assignee-option-name">{placeholder}</span>
              </span>
              {!value && <CheckIcon className="assignee-option-check" style={{ fontSize: 16 }} />}
            </button>
          )}

          {members.length > 0 && <div className="assignee-menu-divider" />}

          {members.map((m) => (
            <button
              key={m.userId}
              type="button"
              role="option"
              aria-selected={value === m.userId}
              className={`assignee-option ${value === m.userId ? 'is-selected' : ''}`}
              onClick={() => handleSelect(m.userId)}
            >
              <UserAvatar
                name={m.fullName}
                email={m.email}
                avatarUrl={m.avatarUrl}
                size="sm"
              />
              <span className="assignee-option-info">
                <span className="assignee-option-name">{m.fullName}</span>
                <span className="assignee-option-email">{m.email}</span>
              </span>
              {value === m.userId && <CheckIcon className="assignee-option-check" style={{ fontSize: 16 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
