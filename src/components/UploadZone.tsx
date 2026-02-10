import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Upload, FolderPlus, File, CheckCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithGoogle, auth } from '../firebase';

interface UploadZoneProps {
  onUpload: (folderId: string, folderName: string) => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items || []);
    if (items.length === 0) return;

    const allFiles: File[] = [];
    let detectedFolderName = '';

    const traverseEntry = async (entry: any) => {
      if (entry.isFile) {
        return new Promise<void>((resolve) => {
          entry.file((file: File) => {
            allFiles.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        if (!detectedFolderName) detectedFolderName = entry.name;
        const dirReader = entry.createReader();
        const entries = await new Promise<any[]>((resolve) => {
          dirReader.readEntries((results: any[]) => resolve(results));
        });
        for (const child of entries) {
           await traverseEntry(child);
        }
      }
    };

    const promises = items.map(item => {
      const entry = item.webkitGetAsEntry();
      if (entry) return traverseEntry(entry);
      return Promise.resolve();
    });

    await Promise.all(promises);

    const imageFiles = allFiles.filter(file => 
      file.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      toast.error('No image files found in selection');
      return;
    }

    if (imageFiles.length !== allFiles.length) {
      toast.warning(`${allFiles.length - imageFiles.length} non-image files were skipped`);
    }

    if (detectedFolderName && !folderName) {
      setFolderName(detectedFolderName);
    }

    processFiles(imageFiles);
  }, [folderName]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      toast.error('Please select only image files');
      return;
    }

    processFiles(imageFiles);
  }, []);

  const processFiles = (selectedFiles: File[]) => {
    const uploadFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      status: 'pending'
    }));

    setFiles(uploadFiles);
    setShowModal(true);
  };

  const createFolderAndUpload = async () => {
    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Please sign in to upload');
      return;
    }

    const googleAccessToken = window.localStorage.getItem('fotika:googleAccessToken');
    if (!googleAccessToken) {
      toast.error('Google Drive access expired. Please sign out and sign in again.');
      return;
    }

    setIsCreatingFolder(true);

    try {
      // Create folder in Google Drive
      const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });

      if (!createFolderResponse.ok) {
        if (createFolderResponse.status === 401) {
            throw new Error('Unauthorized: Please sign out and sign in again to refresh permissions.');
        }
        throw new Error('Failed to create folder');
      }

      const folder = await createFolderResponse.json();
      
      // Make folder public
      await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      // Upload files to the folder
      for (const uploadFile of files) {
        try {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading' as const }
              : f
          ));

          const metadata = {
            name: uploadFile.file.name,
            parents: [folder.id]
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', uploadFile.file);

          const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleAccessToken}`,
            },
            body: form
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${uploadFile.file.name}`);
          }

          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed' as const }
              : f
          ));
        } catch (error) {
          console.error(`Error uploading ${uploadFile.file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error' as const }
              : f
          ));
        }
      }

      toast.success(`Folder "${folderName}" created and files uploaded successfully!`);
      onUpload(folder.id, folderName);
      setShowModal(false);
      setFolderName('');
      setFiles([]);
      
    } catch (error: any) {
      console.error('Error creating folder and uploading files:', error);
      toast.error(error.message || 'Failed to create folder and upload files');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const isAllCompleted = files.length > 0 && files.every(f => f.status === 'completed');

  return (
    <>
      <Card className="h-full border-dashed border-2 border-gray-300 hover:border-teal-400 transition-colors duration-200">
        <CardContent 
          className="h-full flex flex-col items-center justify-center p-6 relative"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload New Images</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drop your images here or click to browse
            </p>
            <div className="flex gap-2 justify-center mb-2">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <File className="w-4 h-4 mr-2" />
                Select Images
              </Button>
              <Button 
                onClick={() => folderInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Select Folder
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG, GIF, WebP (Drag folders supported)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            accept="image/*"
            {...({ webkitdirectory: "", directory: "" } as any)}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Global drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-teal-500 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-dashed border-teal-400">
            <Upload className="w-16 h-16 text-teal-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-teal-700">Drop here to upload</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Folder & Upload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="My Gallery"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Files to Upload ({files.length})</Label>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 p-2 rounded text-sm">
                    <File className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{file.file.name}</span>
                    {file.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {file.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {file.status === 'error' && <X className="w-4 h-4 text-red-500" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
                disabled={isCreatingFolder}
              >
                Cancel
              </Button>
              <Button
                onClick={createFolderAndUpload}
                className="flex-1"
                disabled={!folderName.trim() || files.length === 0 || isCreatingFolder}
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create & Upload
                  </>
                )}
              </Button>
            </div>
            
            {isAllCompleted && (
              <Button
                onClick={() => {
                  setShowModal(false);
                  setFolderName('');
                  setFiles([]);
                }}
                className="w-full"
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadZone;