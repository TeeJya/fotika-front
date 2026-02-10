import React, { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { signInWithGoogle } from '../firebase'
import { toast } from 'sonner'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
}

interface DriveBrowserProps {
  onSelect: (folderId: string, folderName: string) => void
}

export default function DriveBrowser({ onSelect }: DriveBrowserProps) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([{id: 'root', name: 'My Drive'}])
  
  const currentFolder = breadcrumbs[breadcrumbs.length - 1]

  useEffect(() => {
    fetchFiles(currentFolder.id)
  }, [currentFolder.id])

  async function fetchFiles(folderId: string) {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('fotika:googleAccessToken')
    
    if (!token) {
      setError('Google Access Token not found. Please sign in with Google again to grant access.')
      setLoading(false)
      return
    }

    try {
      const q = `'${folderId}' in parents and trashed = false`
      const params = new URLSearchParams({
        q,
        fields: 'files(id, name, mimeType, thumbnailLink)',
        orderBy: 'folder,name',
        pageSize: '100' // Limit to 100 for performance
      })

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        let errorMsg = 'Failed to load Drive files.'
        try {
          const errData = await res.json()
          if (errData.error && errData.error.message) {
            errorMsg = `Google API Error: ${errData.error.message}`
          }
        } catch (e) {
          // ignore json parse error
        }

        if (res.status === 401) {
            setError('Session expired. Please authorize again.')
            toast.error('Session expired', { description: 'Please authorize Google Drive again.' })
        } else if (res.status === 403) {
            setError(`Access denied. ${errorMsg}`)
            toast.error('Access Denied', { description: errorMsg })
        } else {
            setError(errorMsg)
            toast.error('Drive Error', { description: errorMsg })
        }
        throw new Error(errorMsg)
      }

      const data = await res.json()
      // Filter for folders and images client side if needed, or rely on visual cues
      const filtered = (data.files || []).filter((f: DriveFile) => 
        f.mimeType === 'application/vnd.google-apps.folder' || f.mimeType.startsWith('image/')
      )
      setFiles(filtered)
    } catch (err: any) {
      console.error(err)
      if (!error) setError(err.message || 'An error occurred while fetching files.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReauth() {
    try {
      await signInWithGoogle()
      // Retry fetching current folder
      fetchFiles(currentFolder.id)
    } catch (err) {
      console.error("Re-auth failed", err)
    }
  }

  function handleFolderClick(file: DriveFile) {
    setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name }])
  }

  function handleBreadcrumbClick(index: number) {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/30 overflow-x-auto whitespace-nowrap shrink-0">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.id} className="flex items-center text-sm">
            {i > 0 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />}
            <button 
              onClick={() => handleBreadcrumbClick(i)}
              className={cn(
                "hover:underline underline-offset-4", 
                i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/20 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertCircle className="w-10 h-10 text-destructive mb-3 opacity-80" />
                <p className="text-destructive font-medium mb-1">Access Error</p>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">{error}</p>
                <Button variant="outline" onClick={handleReauth}>
                  Authorize Google Drive
                </Button>
            </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Empty folder
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(file => (
              <div 
                key={file.id}
                onClick={() => file.mimeType === 'application/vnd.google-apps.folder' ? handleFolderClick(file) : null}
                className={cn(
                  "group relative aspect-square flex flex-col items-center justify-center p-3 border rounded-xl transition-all duration-200",
                  file.mimeType === 'application/vnd.google-apps.folder' 
                    ? "cursor-pointer bg-white dark:bg-card border-border/50 hover:border-primary/50 hover:shadow-md" 
                    : "bg-muted/10 border-transparent opacity-80"
                )}
              >
                {file.mimeType === 'application/vnd.google-apps.folder' ? (
                  <>
                    <Folder className="w-12 h-12 text-blue-500 mb-3 fill-blue-500/10" />
                    <span className="text-sm font-medium text-center line-clamp-2 w-full px-1">{file.name}</span>
                  </>
                ) : (
                  <>
                    {file.thumbnailLink ? (
                      <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
       <div className="p-4 border-t bg-muted/30 flex justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground truncate">
                Folder: <span className="font-medium text-foreground">{currentFolder.name}</span>
            </div>
             <Button 
                onClick={() => onSelect(currentFolder.id, currentFolder.name)}
                disabled={loading || !!error}
            >
                Select This Folder
            </Button>
       </div>
    </div>
  )
}
