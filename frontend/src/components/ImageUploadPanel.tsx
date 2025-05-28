import React, { useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useStore } from '../contexts/StoreContext';

interface UploadedImage {
  id: string;
  name: string;
  size: number;
  type: string;
  preview: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const ImageUploadPanel: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { agentStore } = useStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      for (const file of files) {
        const image: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          status: 'uploading',
        };

        setImages((prev) => [...prev, image]);

        try {
          // Simulate upload and processing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          image.status = 'processing';
          setImages((prev) => [...prev]);

          // Simulate image processing
          await new Promise((resolve) => setTimeout(resolve, 2000));
          image.status = 'complete';
          setImages((prev) => [...prev]);

          // Send to agent for processing
          agentStore.addEvent({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            message: `Processing image: ${file.name}`,
            metadata: { imageId: image.id },
          });
        } catch (error) {
          image.status = 'error';
          image.error = error instanceof Error ? error.message : 'Upload failed';
          setImages((prev) => [...prev]);
        }
      }
    },
    [agentStore]
  );

  const getStatusColor = (status: UploadedImage['status']) => {
    switch (status) {
      case 'uploading':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'complete':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Image Upload</h2>
        <Badge variant="default">
          {images.length} {images.length === 1 ? 'Image' : 'Images'}
        </Badge>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm text-muted-foreground">
          Drag and drop images here or click to upload
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              const event = { dataTransfer: { files } } as React.DragEvent;
              handleDrop(event);
            };
            input.click();
          }}
        >
          Select Files
        </Button>
      </div>

      <ScrollArea className="mt-4 h-64">
        <div className="space-y-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex items-center space-x-4 p-2 rounded-lg border bg-card"
            >
              <img
                src={image.preview}
                alt={image.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{image.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(image.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Badge variant={getStatusColor(image.status)}>
                {image.status}
              </Badge>
              {image.error && (
                <p className="text-xs text-destructive">{image.error}</p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}; 