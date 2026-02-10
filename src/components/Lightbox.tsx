import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { X, ChevronLeft, ChevronRight, Download, ShoppingCart, Loader2, Phone, CheckCircle2 } from 'lucide-react'
import { initiatePayment, checkPaymentStatus } from '../api'

interface LightboxProps {
  images: any[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  price?: number
  paymentInfo?: string
  channelId?: string
  slug?: string
}

export default function Lightbox({ images, index, onClose, onPrev, onNext, price = 0, channelId, slug }: LightboxProps) {
  const img = (index != null && images) ? images[index] : null
  const [showPayment, setShowPayment] = React.useState(false)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [paymentStep, setPaymentStep] = React.useState<'input' | 'waiting' | 'success'>('input')
  const [pollingRef, setPollingRef] = React.useState<string | null>(null)
  const [unlocked, setUnlocked] = React.useState(false)

  // Persist unlocks locally (per-image) so returning users on same device/IP keep access
  const unlockKey = React.useMemo(() => `fotika-unlock-${img?.id || 'unknown'}`, [img?.id])
  
  // Reset payment state when modal closes or image changes or reopens
  React.useEffect(() => {
     if (!showPayment) {
        setPaymentStep('input')
        setPollingRef(null)
     }
  }, [showPayment])

    // Reset unlock state when the image changes
    React.useEffect(() => {
     // Load persisted unlock state
     const stored = typeof window !== 'undefined' ? window.localStorage.getItem(unlockKey) : null
     setUnlocked(stored === 'true')
    }, [index, unlockKey])

  // Polling Effect
  React.useEffect(() => {
    if (paymentStep !== 'waiting' || !pollingRef) return

    const interval = setInterval(async () => {
      const res = await checkPaymentStatus(pollingRef)
      // Add logging to help diagnose stuck states
      console.log('Payment status poll:', pollingRef, res)

      if (res.status === 'completed') {
        clearInterval(interval)
        setPaymentStep('success')
        setUnlocked(true)
        // Persist unlock for this image on this device/IP
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(unlockKey, 'true')
        }
        setShowPayment(false)
        // Immediately unlock and download (small delay to ensure dialog closes)
        setTimeout(() => handleDownload(true), 50)
        toast.success('Payment Confirmed!', {
          description: 'Your image is unlocking...',
          duration: 4000
        })
      } else if (res.status === 'failed') {
        clearInterval(interval)
        setPaymentStep('input') // Go back to try again
        toast.error('Payment Failed', { description: res.data?.reason || 'Transaction failed or cancelled.' })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentStep, pollingRef])
  
  if (index == null || !img) return null
  
  // Modified to use direct Google Drive thumbnail links (like slideshow) instead of proxy
  // Use =s2048 (2k resolution) or =s0 (original) for high quality
  let src = img.url || 
            (img.thumbnailLink ? img.thumbnailLink.replace(/=s\d+/, '=s2048') : null) || 
            img.webContentLink ||
            (slug && img.id ? `${import.meta.env.VITE_API_BASE}/events/${slug}/proxy/${img.id}` : null)

  const handlePayment = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }
    setIsProcessing(true)
    const toastId = toast.loading('Initiating M-Pesa Request...')
    
    try {
      // Create a unique reference to avoid Duplicate Transaction errors (IMG-{ID}-{Timestamp})
      const uniqueSuffix = Date.now().toString().slice(-4)
      const ref = `IMG-${img.id ? img.id.substring(0, 5) : 'GEN'}-${uniqueSuffix}`.toUpperCase()
      
      const res = await initiatePayment(phoneNumber, price, ref, channelId)
      
      if (res.success) {
        toast.success('STK Push Sent!', { 
          id: toastId, 
          description: 'Please enter your M-Pesa PIN on your phone.',
          duration: 5000
        })
        // Start polling
        setPollingRef(res.reference || ref) // Use returned reference if available
        setPaymentStep('waiting')
      } else {
        toast.error('Payment Failed', { 
          id: toastId, 
          description: res.error || res.message || 'Could not initiate payment.'
        })
      }
    } catch (e) {
      toast.error('Payment Error', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (force: any = false) => {
      // Handle the case where the function is called from an event handler (force is an event object)
      const isForceDownload = typeof force === 'boolean' ? force : false

      // Allow download if price is 0 OR force=true (paid) OR already unlocked
      if (price > 0 && !isForceDownload && !unlocked) {
        setShowPayment(true)
        return
      }

      // Prefer webContentLink (original), fallback to visible src
      if (img.webContentLink) {
        window.open(img.webContentLink, '_blank')
      } else {
        // Fallback if webContentLink is missing or we use proxy
        const link = document.createElement('a')
        link.href = src || ''
        link.download = img.name || 'image'
        link.target = '_blank'
        link.click()
      }
    }

  return (
    <>
    <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-[60] backdrop-blur-sm" onClick={onClose}>
      <div className="max-w-[95%] max-h-[95%] flex flex-col items-center gap-3 w-full justify-center relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center w-full justify-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPrev} 
            className="text-white hover:bg-white/20 h-12 w-12 absolute left-4 z-10 rounded-full"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <div className="relative group overflow-hidden">
             <img 
               src={src} 
               alt={img.name || ''} 
               referrerPolicy="no-referrer"
               className={`max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl select-none transition-all duration-500 ${price > 0 && !unlocked ? 'blur-md scale-[1.02] brightness-75' : ''}`}
               onContextMenu={(e) => e.preventDefault()}
             />
             
             {price > 0 && !unlocked && (
               <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/20 animate-in fade-in duration-500">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl border-2 border-primary/50 text-lg px-8 py-6 rounded-full transition-transform hover:scale-105 active:scale-95"
                    onClick={() => setShowPayment(true)}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Pay KES {price} to Unlock
                  </Button>
                  <p className="text-white/90 text-sm mt-3 font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                     Full resolution instant download
                  </p>
               </div>
             )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNext} 
            className="text-white hover:bg-white/20 h-12 w-12 absolute right-4 z-10 rounded-full"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Download / Buy Button - Only show if free */}
        {(price === 0 || unlocked) && (
           <Button
             className="mt-2 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 z-20"
             variant="outline"
             onClick={handleDownload}
           >
            <Download className="mr-2 h-4 w-4" />
            Download Image
           </Button>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white h-10 w-10 rounded-md"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>

    {/* Payment Dialog */}
    <Dialog open={showPayment} onOpenChange={(open) => { if(!isProcessing && paymentStep !== 'waiting') setShowPayment(open) }}>
      <DialogContent className="sm:max-w-md z-[80]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentStep === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <ShoppingCart className="w-5 h-5" />}
            {paymentStep === 'success' ? 'Payment Successful' : 'Unlock Full Resolution'}
          </DialogTitle>
          <DialogDescription>
            {paymentStep === 'input' && <span>Pay <strong className="text-foreground">KES {price}</strong> instantly via M-Pesa to download.</span>}
            {paymentStep === 'waiting' && 'Waiting for confirmation from M-Pesa...'}
            {paymentStep === 'success' && 'Your download is starting momentarily.'}
          </DialogDescription>
        </DialogHeader>

        {/* removed this chunk in favor of using what's already there but cleaning it up via overwrite */}
        {paymentStep === 'input' && (
        <div className="space-y-4 py-4">
           <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-4 border border-border/50">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                 <ShoppingCart className="text-green-600 dark:text-green-400 w-6 h-6" />
              </div>
              <div className="flex-1">
                 <h4 className="font-semibold text-sm">One-Time Purchase</h4>
                 <p className="text-xs text-muted-foreground">Secure payment via SwiftWallet</p>
              </div>
              <div className="text-right">
                 <span className="text-lg font-bold text-green-600 dark:text-green-400">KES {price}</span>
              </div>
           </div>

           <div className="space-y-2">
             <label className="text-sm font-medium">M-Pesa Phone Number</label>
             <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="0712 345 678" 
                  className="pl-9" 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isProcessing}
                  required
                />
             </div>
             <p className="text-[11px] text-muted-foreground">
               You will receive a prompt on this phone to enter your PIN.
             </p>
           </div>
        </div>
        )}

        {paymentStep === 'waiting' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6 animate-in fade-in">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Phone className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                    <p className="font-semibold text-lg">Check your phone</p>
                    <p className="text-sm text-muted-foreground">Please enter your PIN to complete the transaction.</p>
                </div>
                {/* Manual Check Button for testing immediate response */}
                <Button variant="outline" size="sm" onClick={() => setPollingRef(current => current)}>
                   Checking status... <Loader2 className="ml-2 h-3 w-3 animate-spin"/>
                </Button>
            </div>
        )}

        {paymentStep === 'success' && (
             <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in zoom-in">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-green-600 dark:text-green-400 font-medium">Payment Verified!</p>
                <p className="text-xs text-muted-foreground">Download starting...</p>
             </div>
        )}


        <div className="flex justify-end gap-3">
          {paymentStep === 'input' && (
            <>
              <Button variant="outline" onClick={() => setShowPayment(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing || !phoneNumber} className="bg-green-600 hover:bg-green-700 text-white w-32">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                ) : (
                  'Pay Now'
                )}
              </Button>
            </>
          )}
          {/* Waiting/Success states usually don't have dismiss buttons to encourage waiting, 
              but you could add a 'Close' button if success */}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
