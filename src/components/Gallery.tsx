import React, { useState, useEffect } from 'react'
import ImageCard from './ImageCard'
import Lightbox from './Lightbox'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Download, X, CheckSquare, Loader2, Phone, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { initiatePayment, checkPaymentStatus } from '../api'

export default function Gallery({ images, price, paymentInfo, channelId, slug }: { images: any[], price?: number, paymentInfo?: string, channelId?: string, slug: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Payment State
  const [showPayment, setShowPayment] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'input' | 'waiting' | 'success'>('input')
  const [pollingRef, setPollingRef] = useState<string | null>(null)

  // Reset payment state when modal closes
  useEffect(() => {
     if (!showPayment) {
        setPaymentStep('input')
        setPollingRef(null)
     }
  }, [showPayment])

  // Polling Effect
  useEffect(() => {
    if (paymentStep !== 'waiting' || !pollingRef) return

    const interval = setInterval(async () => {
      const res = await checkPaymentStatus(pollingRef)
      console.log('Batch Payment poll:', pollingRef, res)

      if (res.status === 'completed') {
        clearInterval(interval)
        setPaymentStep('success')
        
        // Persist unlock for all selected images
        if (typeof window !== 'undefined') {
          selectedIds.forEach(id => {
             window.localStorage.setItem(`fotika-unlock-${id}`, 'true')
          })
        }
        
        setShowPayment(false)
        toast.success('Payment Confirmed!', {
          description: 'Starting your downloads...',
          duration: 4000
        })
        // Delay download slightly
        setTimeout(() => performDownload(), 500)
      } else if (res.status === 'failed') {
        clearInterval(interval)
        setPaymentStep('input')
        toast.error('Payment Failed', { description: res.data?.reason || 'Transaction failed.' })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentStep, pollingRef, selectedIds]) // Review deps


  function open(img: any) {
    if (selectedIds.size > 0) {
      toggleSelection(img.id)
    } else {
      const idx = images.findIndex((i: any) => i.id === img.id)
      setOpenIndex(idx >= 0 ? idx : 0)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(images.map(img => img.id)))
    }
  }

  const getPayableCount = () => {
     let count = 0
     selectedIds.forEach(id => {
         const unlocked = typeof window !== 'undefined' && window.localStorage.getItem(`fotika-unlock-${id}`) === 'true'
         if (!unlocked) count++
     })
     return count
  }

  const performDownload = async () => {
    const selectedImages = images.filter(img => selectedIds.has(img.id))
    toast.info(`Starting download of ${selectedImages.length} images...`)

    for (const img of selectedImages) {
      try {
        const link = document.createElement('a')
        const proxyUrl = slug && img.id 
             ? `${import.meta.env.VITE_API_BASE}/events/${slug}/proxy/${img.id}?token=${Date.now()}`
             : null

        // Use webContentLink if available, usually best for download
        link.href = proxyUrl || img.webContentLink || img.thumbnailLink 
        link.download = img.name || `fotika-${img.id}.jpg`
        link.target = '_blank'
        // Avoid target="_blank" to reduce popup blocking for multiple downloads
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Increased delay to help with browser pacing
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        console.error('Download failed', err)
      }
    }
    toast.success('Download sequence completed')
    setSelectedIds(new Set())
  }

  const handleBatchPayment = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }
    
    const amount = (price || 0) * getPayableCount()
    if (amount <= 0) {
        // Should not happen if we check before showing dialog, but for safety
        performDownload()
        setShowPayment(false)
        return
    }

    setIsProcessing(true)
    const toastId = toast.loading('Initiating Batch Request...')
    
    try {
      const uniqueSuffix = Date.now().toString().slice(-4)
      const ref = `BATCH-${selectedIds.size}-${uniqueSuffix}`.toUpperCase()
      
      const res = await initiatePayment(phoneNumber, amount, ref, channelId)
      
      if (res.success) {
        toast.success('STK Push Sent!', { 
          id: toastId, 
          description: `Please pay KES ${amount} on your phone.` 
        })
        setPollingRef(res.reference || ref)
        setPaymentStep('waiting')
      } else {
        toast.error('Payment Failed', { id: toastId, description: res.message || 'Could not initiate payment.' })
      }
    } catch (e) {
      toast.error('Payment Error', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSelected = async () => {
    const payable = getPayableCount()
    const amount = (price || 0) * payable
    
    if (amount > 0) {
      setShowPayment(true)
    } else {
      performDownload()
    }
  }

  function close() { setOpenIndex(null) }
  function prev() { if (openIndex == null) return; setOpenIndex((openIndex - 1 + images.length) % images.length) }
  function next() { if (openIndex == null) return; setOpenIndex((openIndex + 1) % images.length) }

  return (
    <div className="relative">
      {/* Selection Header/Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-black/90 text-white px-4 py-3 rounded-full shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 backdrop-blur-sm border border-white/10">
          <span className="font-medium text-sm whitespace-nowrap min-w-[4rem] text-center">{selectedIds.size} selected</span>
          
          <div className="h-4 w-px bg-gray-700 hidden sm:block" />
          
          <button 
            onClick={selectAll}
            className="text-xs sm:text-sm hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            {selectedIds.size === images.length ? 'Deselect All' : 'Select All'}
          </button>
          
          <Button 
            size="sm" 
            onClick={downloadSelected}
            className="bg-teal-500 hover:bg-teal-600 text-white border-0 rounded-full h-8 px-3 sm:px-4 text-xs sm:text-sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
            Download
          </Button>
          
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2 mt-6 pb-20">
        {images.map((img: any) => (
          <ImageCard 
            key={img.id || img.name} 
            img={img} 
            onOpen={open}
            isSelected={selectedIds.has(img.id)}
            selectionMode={selectedIds.size > 0}
            onToggleSelect={() => toggleSelection(img.id)}
            slug={slug}
          />
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox 
           images={images} 
           index={openIndex} 
           onClose={close} 
           onPrev={prev} 
           onNext={next}
           price={price}
           paymentInfo={paymentInfo}
           channelId={channelId}
           slug={slug}
        />
      )}

      {/* Batch Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Unlock {getPayableCount()} Images</DialogTitle>
            <DialogDescription className="text-gray-400">
               Total: <strong className="text-white">KES {(price || 0) * getPayableCount()}</strong>
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-4 py-4">
              {paymentStep === 'input' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">M-Pesa Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="tel"
                        placeholder="07XX XXX XXX"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500/50"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
                    onClick={handleBatchPayment}
                    disabled={isProcessing}
                  >
                     {isProcessing ? (
                        <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </div>
                    ) : (
                      `Pay KES ${(price || 0) * getPayableCount()}`
                    )}
                  </Button>
                </div>
              )}

              {paymentStep === 'waiting' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
                    <Loader2 className="h-12 w-12 text-teal-500 animate-spin relative z-10" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-medium text-lg">Check your phone</h3>
                    <p className="text-sm text-muted-foreground">Enter M-Pesa PIN to complete payment</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-lg text-green-400">Payment Successful!</h3>
                    <p className="text-sm text-gray-400">Downloading your images...</p>
                  </div>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
