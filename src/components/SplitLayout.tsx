import React, { useState, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

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

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleTextEdit = useCallback((originalText: string, newText: string) => {
    const updatedCode = code.replace(originalText, newText);
    setCode(updatedCode);
  }, [code]);

  const handleElementDelete = useCallback((html: string) => {
    setCode(current => current.replace(html, ''));
  }, []);

  const handleRun = useCallback(() => {
    // Force refresh by updating code
    setCode(prev => prev);
  }, []);

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={20} className="overflow-y-auto">
          <CodeEditor value={code} onChange={handleCodeChange} onRun={handleRun} />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border" />
        <ResizablePanel minSize={20} className="overflow-y-auto">
          <LivePreview code={code} onTextEdit={handleTextEdit} onElementDelete={handleElementDelete} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitLayout;
