import React, { useState, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const SplitLayout: React.FC = () => {
  const [code, setCode] = useState(defaultCode);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleTextEdit = useCallback((originalText: string, newText: string) => {
    // Find and replace the original text in the code
    const updatedCode = code.replace(originalText, newText);
    setCode(updatedCode);
  }, [code]);

  const handleRun = useCallback(() => {
    // Force refresh by updating code
    setCode(prev => prev);
  }, []);

  const getLayoutClasses = () => {
    let desktop = "md:grid-cols-2";
    if (leftCollapsed && rightCollapsed) {
      desktop = "md:grid-cols-[40px_1fr_40px]";
    } else if (leftCollapsed) {
      desktop = "md:grid-cols-[40px_1fr]";
    } else if (rightCollapsed) {
      desktop = "md:grid-cols-[1fr_40px]";
    }
    return `grid-cols-1 ${desktop}`;
  };

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      <div className={`h-full grid ${getLayoutClasses()} transition-all duration-300`}>
        {/* Left Panel - Code Editor */}
        {leftCollapsed ? (
          <div className="bg-editor-bg border-r border-editor-border flex items-center justify-center h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftCollapsed(false)}
              className="rotate-180 text-text-muted hover:text-foreground"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="relative h-full">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              onRun={handleRun}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftCollapsed(true)}
              className="absolute top-3 right-2 text-text-muted hover:text-foreground z-10"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Right Panel - Live Preview */}
        {rightCollapsed ? (
          <div className="bg-preview-bg border-l border-gray-200 flex items-center justify-center h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightCollapsed(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="relative h-full">
            <LivePreview
              code={code}
              onTextEdit={handleTextEdit}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightCollapsed(true)}
              className="absolute top-3 left-2 text-gray-600 hover:text-gray-900 z-10"
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitLayout;
