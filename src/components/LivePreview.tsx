import React, { useRef, useEffect, useState } from 'react';
import { Monitor, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePreviewProps {
  code: string;
  onTextEdit: (originalText: string, newText: string) => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({ code, onTextEdit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updatePreview = () => {
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
  };

  const enableInlineEditing = (doc: Document) => {
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
    while (node = walker.nextNode()) {
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
        content: 'Click on any text to edit inline';
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
  };

  useEffect(() => {
    updatePreview();
  }, [code]);

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