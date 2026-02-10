import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Check, CheckCircle2 } from 'lucide-react'

interface ImageCardProps {
  img: any
  onOpen: (img: any) => void
  isSelected?: boolean
  selectionMode?: boolean
  onToggleSelect?: () => void
  slug?: string
}

export default function ImageCard({ 
  img, 
  onOpen, 
  isSelected = false, 
  selectionMode = false,
  onToggleSelect,
  slug
}: ImageCardProps) {
  const proxyUrl = slug && img.id 
    ? `${import.meta.env.VITE_API_BASE}/events/${slug}/proxy/${img.id}`
    : null

  const src = proxyUrl || img.thumbnailLink || img.webContentLink || img.thumbnail || img.smallUrl
  // Use a larger thumbnail for the actual display if possible to avoid blurs
  // If we have a proxy, use it (it serves full or streamed content). 
  // Ideally for grid we want small images, but proxy returns full.
  // Actually, for grid, fetching full 20MB images via proxy is bad.
  // We can add a ?size= param to proxy if we want to implement resizing on backend, 
  // BUT the user's issue was "black for the lightbox", implying the main view.
  // For the grid, usually the thumbnailLink works ok because it's small.
  // However, if the user says "my images tend to get link 403", it might affect thumbnails too.
  // Let's use proxy for everything for reliability, but maybe we should trust thumbnailLink for grid if it works?
  // The user linked a thumbnail URL that was 403.
  const displaySrc = proxyUrl || (img.thumbnailLink ? img.thumbnailLink.replace(/=s\d+/, '=s600') : src)
  
  const timerRef = useRef<any>(null)
  const isLongPress = useRef(false)

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      if (onToggleSelect) {
        // Vibrate if available
        if (navigator.vibrate) navigator.vibrate(50)
        onToggleSelect()
      }
    }, 500) // 500ms for long press
  }, [onToggleSelect])

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleTouchMove = useCallback(() => {
     if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // If it was a long press, don't open
    if (isLongPress.current) return
    
    // If in selection mode, toggle instead of open
    if (selectionMode && onToggleSelect) {
      onToggleSelect()
    } else {
      onOpen(img)
    }
  }

  return (
    <div 
      className={`bg-card rounded-xl overflow-hidden relative cursor-pointer border transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg group mb-2 break-inside-avoid select-none ${
        isSelected ? 'border-teal-500 ring-2 ring-teal-500 shadow-md translate-y-[-2px]' : 'border-border hover:border-border/80 shadow-sm'
      }`}
      onClick={handleClick}
      onContextMenu={(e) => {
        // Prevent context menu on mobile if we want to use long press
        // But on desktop user might want to save image
        if ('ontouchstart' in window) {
            e.preventDefault()
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <img 
        src={displaySrc} 
        alt={img.name || ''} 
        loading="lazy" 
        referrerPolicy="no-referrer"
        className={`w-full h-auto object-contain block transition-transform duration-200 ${isSelected ? 'scale-[0.98]' : ''}`}
        onError={(e) => {
          // Fallback if image fails (e.g. broken link)
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted');
        }}
      />
      
      {/* Watermark Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <img 
          src="/logo.svg" 
          alt="" 
          className="w-[40%] h-[40%] object-contain opacity-50 filter grayscale invert" 
        />
      </div>

      {/* Selection Checkbox (Visible on hover or if selected) */}
      {(onToggleSelect) && (
        <div 
          className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${
            isSelected || selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-colors ${
            isSelected 
              ? 'bg-teal-500 border-teal-500 text-white' 
              : 'bg-black/30 border-white/70 hover:bg-black/50 hover:border-white'
          }`}>
            {isSelected && <Check className="w-4 h-4" />}
          </div>
        </div>
      )}

      {img.name && (
        <div className={`absolute left-2.5 bottom-2.5 bg-black/70 text-white px-2.5 py-1.5 rounded-lg text-sm backdrop-blur-sm transition-opacity ${
            isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {img.name}
        </div>
      )}
      
      {/* Selected Overlay Tint */}
      {isSelected && (
        <div className="absolute inset-0 bg-teal-500/10 pointer-events-none" />
      )}
    </div>
  )
}
