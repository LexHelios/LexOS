import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { ScrollArea } from './ui/scroll-area';
import { useStore } from '../contexts/StoreContext';
import { Progress } from './ui/progress';

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  progress?: number;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.xlsx,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DocumentUploadPanel: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { agentStore } = useStore();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit`;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(`.${extension}`)) {
      return `File type not supported. Please upload PDF, DOCX, XLSX, or TXT files`;
    }
    
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setDocuments(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          error: validationError
        }]);
        continue;
      }

      const doc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setDocuments(prev => [...prev, doc]);

      try {
        // Simulate upload with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setDocuments(prev => prev.map(d => 
            d.id === doc.id ? { ...d, progress } : d
          ));
        }

        doc.status = 'processing';
        setDocuments(prev => [...prev]);

        // Simulate document processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        doc.status = 'complete';
        setDocuments(prev => [...prev]);

        // Send to agent for processing
        agentStore.addEvent({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          message: `Processing document: ${file.name}`,
          metadata: { documentId: doc.id },
        });
      } catch (error) {
        doc.status = 'error';
        doc.error = error instanceof Error ? error.message : 'Upload failed';
        setDocuments(prev => [...prev]);
      }
    }
    
    setIsUploading(false);
  }, [agentStore]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await processFiles(files);
    },
    [processFiles]
  );

  const getStatusColor = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return 'default';
      case 'processing':
        return 'primary';
      case 'complete':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Document Upload</h2>
        <Badge variant="default">
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </Badge>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm text-muted-foreground">
          Drag and drop PDF, DOCX, XLSX, or TXT files here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Maximum file size: 10MB
        </p>
        <Button
          variant="outline"
          className="mt-4"
          disabled={isUploading}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = ACCEPTED_EXTENSIONS;
            input.multiple = true;
            input.onchange = (e) => handleFileInput(e as any);
            input.click();
          }}
        >
          {isUploading ? 'Uploading...' : 'Select Files'}
        </Button>
      </div>

      <ScrollArea className="mt-4 h-48">
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col p-2 rounded-lg border bg-card"
            >
              <div className="flex items-center space-x-4">
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(doc.size / 1024).toFixed(1)} KB &middot; {doc.type || 'Unknown'}
                  </p>
                </div>
                <Badge variant={getStatusColor(doc.status)}>
                  {doc.status}
                </Badge>
              </div>
              {doc.progress !== undefined && doc.status === 'uploading' && (
                <Progress value={doc.progress} className="mt-2" />
              )}
              {doc.error && (
                <p className="text-xs text-error mt-1">{doc.error}</p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}; 