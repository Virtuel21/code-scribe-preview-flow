import React, { useState, useRef, useEffect } from 'react';
import { Copy, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onRun }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  const resetCode = () => {
    const defaultCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        button {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 24px;
            font-size: 1rem;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            background: white;
            color: #667eea;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Live Editor</h1>
        <p>Edit this text directly in the preview or modify the code on the left!</p>
        <button onclick="alert('Hello from the live preview!')">Click Me</button>
    </div>
</body>
</html>`;
    onChange(defaultCode);
  };

  return (
    <div className="h-full flex flex-col bg-editor-bg border-r border-editor-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-editor-gutter border-b border-editor-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-sm text-text-muted font-mono">index.html</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-2 text-text-muted hover:text-foreground"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCode}
            className="h-7 px-2 text-text-muted hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            className="h-7 px-2 text-accent-primary hover:text-accent-primary/80"
          >
            <Play className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex relative">
        {/* Line numbers */}
        <div className="w-12 bg-editor-gutter border-r border-editor-border flex flex-col text-right py-3 select-none">
          {lineNumbers.map((lineNum) => (
            <div
              key={lineNum}
              className="text-xs text-text-muted font-mono leading-6 px-2"
            >
              {lineNum}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-3 bg-transparent text-foreground font-mono text-sm leading-6 resize-none outline-none border-none overflow-y-auto"
            placeholder="Write your HTML, CSS, and JavaScript here..."
            spellCheck={false}
            style={{
              tabSize: 2,
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 bg-editor-gutter border-t border-editor-border text-xs text-text-muted font-mono flex justify-between">
        <span>Ln {value.substring(0, value.indexOf('\n') !== -1 ? value.indexOf('\n') : value.length).split('\n').length}</span>
        <span>Ctrl+Enter to run</span>
      </div>
    </div>
  );
};

export default CodeEditor;