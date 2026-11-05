import React from 'react';

function renderInline(text) {
  if (!text) return null;

  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="ai-text-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${match.index}`} className="ai-text-italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${match.index}`} className="ai-text-code">
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function FormattedAiText({ content }) {
  if (!content) return null;

  const rawLines = content.split(/\r?\n/);
  const elements = [];
  let currentList = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="ai-text-ul">
          {currentList.items.map((item, idx) => (
            <li key={`uli-${idx}`} className="ai-text-li">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    } else if (currentList.type === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="ai-text-ol">
          {currentList.items.map((item, idx) => (
            <li key={`oli-${idx}`} className="ai-text-li">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  rawLines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line === '---' || line === '***') {
      flushList();
      elements.push(<hr key={`hr-${index}`} className="ai-text-hr" />);
      return;
    }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h5 key={`h5-${index}`} className="ai-text-heading">
          {renderInline(line.substring(4))}
        </h5>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${index}`} className="ai-text-heading">
          {renderInline(line.substring(3))}
        </h4>
      );
      return;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (currentList && currentList.type !== 'ul') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    const numberMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (numberMatch) {
      if (currentList && currentList.type !== 'ol') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${index}`} className="ai-text-paragraph">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="ai-formatted-container">{elements}</div>;
}
