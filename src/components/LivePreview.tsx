import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Monitor, RefreshCw, Maximize2, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePreviewProps {
  code: string;
  onTextEdit: (originalText: string, newText: string) => void;
  onElementDelete: (elementHtml: string) => void;
  onElementSelect?: (lineNumber: number) => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({ code, onTextEdit, onElementDelete, onElementSelect }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const deleteModeRef = useRef(deleteMode);
  const selectedElRef = useRef<HTMLElement | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement | null>(null);

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;
    
    setIsLoading(true);
    const iframe = iframeRef.current;
    
    // Create a new document in the iframe
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(code);
    doc.close();

    // Add inline editing functionality
    setTimeout(() => {
      enableInlineEditing(doc);
      setIsLoading(false);
    }, 100);
  }, [code]);

  const enableInlineEditing = (doc: Document) => {
    // Create a toolbar fixed at the top of the preview for text formatting
    const toolbar = doc.createElement('div');
    toolbar.style.position = 'fixed';
    toolbar.style.top = '0';
    toolbar.style.left = '0';
    toolbar.style.right = '0';
    toolbar.style.display = 'flex';
    toolbar.style.background = '#fff';
    toolbar.style.borderBottom = '1px solid #ccc';
    toolbar.style.padding = '4px';
    toolbar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    toolbar.style.zIndex = '10000';
    toolbar.style.fontFamily = 'system-ui, sans-serif';

    const createBtn = (label: string, command: string) => {
      const btn = doc.createElement('button');
      btn.textContent = label;
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.padding = '2px 4px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '12px';
      // Prevent losing selection when clicking toolbar buttons
      btn.onmousedown = (e) => e.preventDefault();
      btn.onclick = (e) => {
        e.preventDefault();
        doc.execCommand(command);
      };
      return btn;
    };

    toolbar.appendChild(createBtn('B', 'bold'));
    toolbar.appendChild(createBtn('I', 'italic'));
    toolbar.appendChild(createBtn('U', 'underline'));

    doc.body.insertBefore(toolbar, doc.body.firstChild);
    doc.body.style.paddingTop = '32px';
    // Find all text nodes and make them editable
    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentNode as Element;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip script tags, style tags, and empty text nodes
          const tagName = parent.tagName?.toLowerCase();
          if (tagName === 'script' || tagName === 'style') {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          if (!text || text.length < 2) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    // Wrap text nodes in editable spans
    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode as Element;
      if (!parent) return;

      const span = doc.createElement('span');
      span.setAttribute('contenteditable', 'true');
      span.setAttribute('data-editable', 'true');
      span.textContent = textNode.textContent;
      span.style.cssText = `
        outline: none;
        border-radius: 2px;
        transition: all 0.2s ease;
        display: inline;
        min-width: 20px;
        min-height: 1em;
      `;

      // Add hover effect
      span.addEventListener('mouseenter', () => {
        span.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        span.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.3)';
      });

      span.addEventListener('mouseleave', () => {
        if (!span.matches(':focus')) {
          span.style.backgroundColor = 'transparent';
          span.style.boxShadow = 'none';
        }
      });

      span.addEventListener('focus', () => {
        span.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        span.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.4)';
      });

      span.addEventListener('blur', () => {
        span.style.backgroundColor = 'transparent';
        span.style.boxShadow = 'none';
        
        // Trigger text update
        const newText = span.textContent || '';
        const originalText = textNode.textContent || '';
        if (newText !== originalText) {
          onTextEdit(originalText, newText);
        }
      });

      // Handle Enter key to blur
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          span.blur();
        }
      });

      parent.replaceChild(span, textNode);
    });

    // Add editing instructions
    const style = doc.createElement('style');
    style.textContent = `
      [data-editable]:empty::before {
        content: 'Click to edit';
        color: #999;
        font-style: italic;
      }
      body {
        position: relative;
      }
      body::after {
        content: 'Click text to edit. Enable edit mode to remove divs';
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: system-ui, sans-serif;
        z-index: 1000;
        opacity: 0.7;
        animation: fadeInOut 3s ease-in-out;
      }
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.7; }
      }
    `;
    doc.head.appendChild(style);

    const clearHighlight = (el: HTMLElement | null) => {
      if (!el) return;
      if (selectedElRef.current === el) return;
      el.style.outline = '';
    };

    const handleHover = (e: MouseEvent) => {
      if (!deleteModeRef.current) return;
      if (!(e.target instanceof HTMLElement)) return;
      let target = e.target as HTMLElement;
      if (target.getAttribute('data-editable') === 'true') {
        target = target.parentElement as HTMLElement;
      }
      if (target.tagName !== 'DIV') return;
      if (selectedElRef.current && selectedElRef.current !== target) {
        clearHighlight(selectedElRef.current);
      }
      target.style.outline = '1px dashed rgba(59,130,246,0.7)';
    };

    const handleOut = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      let target = e.target as HTMLElement;
      if (target.getAttribute('data-editable') === 'true') {
        target = target.parentElement as HTMLElement;
      }
      if (target.tagName !== 'DIV') return;
      if (target !== selectedElRef.current) {
        target.style.outline = '';
      }
    };


    const findLineNumber = (el: HTMLElement): number | null => {
      const html = el.outerHTML.trim();
      const index = code.indexOf(html);
      if (index !== -1) {
        return code.slice(0, index).split('\n').length;
      }

      const tag = el.tagName.toLowerCase();
      const id = el.id ? `id="${el.id}"` : null;
      const className = el.getAttribute('class');
      const lines = code.split('\n');

      const matchesLine = (line: string, str: string) => line.includes(str);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (id && matchesLine(line, `<${tag}`) && matchesLine(line, id)) return i + 1;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (className && matchesLine(line, `<${tag}`) && matchesLine(line, `class="${className}`)) return i + 1;
      }

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`<${tag}`)) return i + 1;
      }

      return null;
    };

    const handleSelect = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      let target = e.target as HTMLElement;
      if (target.getAttribute('data-editable') === 'true') {
        target = target.parentElement as HTMLElement;
      }

      const line = findLineNumber(target);
      if (line && onElementSelect) {
        onElementSelect(line);
      }

      if (!deleteModeRef.current) return;
      if (target.tagName !== 'DIV') return;

      e.preventDefault();
      e.stopPropagation();

      if (selectedElRef.current && selectedElRef.current !== target) {
        selectedElRef.current.style.outline = '';
      }

      selectedElRef.current = target;
      target.style.outline = '2px solid rgba(239,68,68,0.8)';

      let btn = deleteBtnRef.current;
      if (!btn) {
        btn = doc.createElement('button');
        btn.textContent = '🗑️';
        btn.style.position = 'absolute';
        btn.style.zIndex = '10000';
        btn.style.background = '#ef4444';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.padding = '2px 6px';
        btn.style.fontSize = '12px';
        btn.style.cursor = 'pointer';
        deleteBtnRef.current = btn;
        doc.body.appendChild(btn);
      }

      const rect = target.getBoundingClientRect();
      btn.style.top = `${rect.top + doc.documentElement.scrollTop}px`;
      btn.style.left = `${rect.right + doc.documentElement.scrollLeft - btn.offsetWidth}px`;

      btn.onclick = () => {
        const html = target.outerHTML;
        target.remove();
        btn?.remove();
        deleteBtnRef.current = null;
        selectedElRef.current = null;
        onElementDelete(html);
      };
    };

    doc.addEventListener('mouseover', handleHover);
    doc.addEventListener('mouseout', handleOut);
    doc.addEventListener('click', handleSelect);
  };

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  useEffect(() => {
    deleteModeRef.current = deleteMode;
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.body.style.cursor = deleteMode ? 'pointer' : 'auto';
    }
    if (!deleteMode && doc) {
      if (deleteBtnRef.current) {
        deleteBtnRef.current.remove();
        deleteBtnRef.current = null;
      }
      if (selectedElRef.current) {
        selectedElRef.current.style.outline = '';
        selectedElRef.current = null;
      }
    }
  }, [deleteMode]);

  const refreshPreview = () => {
    updatePreview();
  };

  const openInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(code);
      newWindow.document.close();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="h-full flex flex-col bg-preview-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600 font-medium">Live Preview</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            className="h-7 px-2 text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-7 px-2 text-gray-600 hover:text-gray-900"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant={deleteMode ? 'destructive' : 'ghost'}
            size="sm"
            onClick={() => setDeleteMode((v) => !v)}
            className="h-7 px-2 text-gray-600 hover:text-gray-900"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-7 px-2 text-gray-600 hover:text-gray-900"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Live Preview"
        />
      </div>
    </div>
  );
};

export default LivePreview;

