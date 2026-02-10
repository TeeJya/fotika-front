import React from 'react'
import { createEvent, setFolderPublic, getDriveFiles, getUserSettings } from '../api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { FolderOpen, ArrowLeft, Copy, ExternalLink, Check, Info, Coins } from 'lucide-react'
import DriveBrowser from './DriveBrowser'
import UploadZone from './UploadZone'
import { toast } from 'sonner'
import { signInWithGoogle, auth } from '../firebase'

export default function Dashboard() {
  const [title, setTitle] = React.useState('')
  const [eventDate, setEventDate] = React.useState('')
  const [selectedFolder, setSelectedFolder] = React.useState<{id: string, name: string} | null>(null)
  
  // Pricing State
  const [price, setPrice] = React.useState('')
  const [userSettings, setUserSettings] = React.useState<any>(null)

  const [isCreating, setIsCreating] = React.useState(false)
  const [createdSlug, setCreatedSlug] = React.useState<string | null>(null)
  const [autoPublic, setAutoPublic] = React.useState(true)

  // Load user settings on mount
  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
        if(u) {
            const settings = await getUserSettings(u.uid)
            setUserSettings(settings || {})
        }
    })
    return () => unsub()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFolder) return
    
    // Validate Payment
    if (Number(price) > 0 && !userSettings?.mpesaNumber) {
        toast.error('Payment Method Missing', {
            description: 'You must configure M-Pesa in Settings before creating paid galleries.',
            action: {
                label: 'Go to Settings',
                onClick: () => window.location.hash = '#/settings'
            },
            duration: 8000
        })
        return
    }

    setIsCreating(true)
    const toastId = toast.loading('Setting up gallery...')
    
    try {
      let token = window.localStorage.getItem('fotika:googleAccessToken')

      // 1. If requested, try to make the folder public
      if (autoPublic && token) {
        try {
            toast.loading('Updating folder permissions...', { id: toastId })
            await setFolderPublic(token, selectedFolder.id)
            toast.success('Folder is now public', { id: toastId })
        } catch (err: any) {
             console.error('Permission update failed', err)
             let errMsg = err.message
             let reason = ''
             try { const p = JSON.parse(err.message); errMsg=p.message; reason=p.reason } catch(e){}
             if (reason === 'insufficientPermissions' || errMsg.includes('403')) {
                 toast.error('Permission Missing', { id: toastId, description: 'Please reconnect your Google Account with full permissions.', action: { label: 'Reconnect', onClick: signInWithGoogle } })
                 setIsCreating(false)
                 return
             }
        }
      }

      // 2. Fetch images now (Snapshot)
      let initialImages: any[] = []
      if (token) {
        try {
            toast.loading('Scanning folder for images...', { id: toastId })
            initialImages = await getDriveFiles(selectedFolder.id, token)
            
            if (initialImages.length === 0) {
              toast.warning('No images found in top-level folder.', { 
                id: toastId,
                description: 'The gallery will be empty. Make sure images are not in subfolders.', 
                duration: 6000 
              })
            } else {
              toast.loading(`Found ${initialImages.length} images...`, { id: toastId })
            }
        } catch (e: any) {
            console.warn('Could not pre-fetch images', e)
        }
      }

      const uid = auth.currentUser?.uid || 'anonymous'
      const mpesaNumber = userSettings?.mpesaNumber || ''

      // 3. Create the event
      toast.loading('Finalizing gallery...', { id: toastId })
      const res = await createEvent({ 
        title: title || selectedFolder.name, 
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        driveFolderId: selectedFolder.id, 
        userId: uid, 
        visibility: 'unlisted',
        images: initialImages,
        price: Number(price) || 0,
        mpesaNumber: mpesaNumber,
        paymentInfo: mpesaNumber ? `Pay via M-Pesa to ${mpesaNumber}` : '',
        paymentProvider: 'swiftwallet'
      })
      
      if (!res.ok) throw new Error(res.error || 'Failed to create gallery')
      
      setCreatedSlug(res.event.slug)
      toast.success('Gallery created successfully!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error creating gallery', { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  const copyLink = () => {
    if (!createdSlug) return
    const url = `${window.location.origin}/#/e/${createdSlug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  if (createdSlug) {
    const url = `${window.location.origin}/#/e/${createdSlug}`
    return (
      <div className="container mx-auto p-8 max-w-3xl pt-20">
        <Card className="border-2 text-center border-green-200 dark:border-green-800 shadow-2xl">
        <CardHeader>
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Gallery Created!</CardTitle>
          <CardDescription className="text-lg">Your gallery is ready to share</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col gap-2 text-left bg-muted/30 p-6 rounded-xl border border-border/50">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Shareable Link</label>
            <div className="flex gap-2">
              <Input value={url} readOnly className="font-mono bg-background text-lg h-12" />
              <Button variant="outline" size="icon" onClick={copyLink} className="h-12 w-12 shrink-0">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" onClick={() => { setCreatedSlug(null); setSelectedFolder(null); setTitle(''); }}>
              Create Another
            </Button>
            <a href={`#/e/${createdSlug}`} target="_blank" rel="noreferrer">
              <Button size="lg" className="px-8">
                View Gallery 
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    )
  }

  if (selectedFolder) {
    return (
      <Card className="border-2 max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-right-4">
        <CardHeader>
           <Button variant="ghost" size="sm" className="w-fit mb-2 -ml-2 hover:bg-muted" onClick={() => setSelectedFolder(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Change Folder
           </Button>
          <CardTitle className="text-2xl">Configure Gallery</CardTitle>
          <CardDescription>Setup details for "{selectedFolder.name}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Gallery Title</label>
                <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder={selectedFolder.name}
                className="h-11"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Event Date</label>
                <Input 
                type="date"
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)} 
                className="h-11"
                />
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30 text-sm">
             <div className="flex items-start gap-3">
               <input 
                    type="checkbox" 
                    id="autoPublic" 
                    checked={autoPublic} 
                    onChange={e => setAutoPublic(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary w-4 h-4" 
                />
                <div>
                    <label htmlFor="autoPublic" className="font-medium text-blue-900 dark:text-blue-200 cursor-pointer block mb-1">
                        Make public automatically
                    </label>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                        Allows visitors to view photos without needing their own Google login.
                    </p>
                </div>
             </div>
          </div>
          
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-2">Monetization</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-500" /> 
                        Price per Download (KES)
                    </label>
                    <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-500 text-sm">KES</span>
                       <Input 
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-11 pl-12"
                       />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Leave 0 for free. {Number(price) > 0 && !userSettings?.mpesaNumber && <span className="text-red-400 font-medium">Payment info missing in Settings.</span>}
                    </p>
                </div>
            </div>
            {Number(price) > 0 && userSettings?.mpesaNumber && (
                   <div className="text-sm text-green-400 flex items-center gap-2 mt-2 bg-green-900/10 p-2 rounded border border-green-900/20">
                     <Check className="w-4 h-4" />
                     Payments will account to: <span className="font-mono">{userSettings.mpesaNumber}</span>
                   </div>
            )}
          </div>
          
          <div className="pt-4">
             <Button onClick={onCreate} className="w-full h-12 text-lg" size="lg" disabled={isCreating}>
               {isCreating ? 'Creating...' : 'Create Gallery'}
             </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2">
             <FolderOpen className="w-6 h-6 text-primary" />
             Select or Upload Folder
           </CardTitle>
           <CardDescription>Choose an existing folder from your Drive or upload new images</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex gap-4">
           <div className="flex-1">
             <DriveBrowser onSelect={(id, name) => setSelectedFolder({ id, name })} />
           </div>
           <div className="w-80">
             <UploadZone onUpload={(folderId, name) => setSelectedFolder({ id: folderId, name })} />
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
