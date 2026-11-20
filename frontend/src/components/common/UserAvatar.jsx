import React, { useState } from 'react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #db2777 0%, #e11d48 100%)',
];

function getInitials(name) {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'U';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGradient(seed) {
  const text = (seed || 'user').toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 997;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function UserAvatar({ name, email, avatarUrl, size = 'md', className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = Boolean(avatarUrl) && failedUrl !== avatarUrl;

  return (
    <span
      className={`epms-avatar epms-avatar-${size} ${className}`.trim()}
      style={showImage ? undefined : { background: getGradient(email || name) }}
      title={name || email || ''}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        <span className="epms-avatar-initials">{getInitials(name || email)}</span>
      )}
    </span>
  );
}

