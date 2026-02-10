import React, { useState, useEffect, useRef } from 'react'
import { fetchEvent } from '../api'
import Gallery from './Gallery'
import Navbar from './Navbar'
import Footer from './Footer'

function DraggableFab() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false) // Distinguish click vs drag
  const offset = useRef({ x: 0, y: 0 })
  const isInitialized = useRef(false)

  useEffect(() => {
    // Initial position: Bottom-Right
    if (!isInitialized.current) {
        setPosition({ 
            x: window.innerWidth - 80, 
            y: window.innerHeight - 80 
        })
        isInitialized.current = true
    }
  }, [])

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      
      // Prevent default to stop scrolling/selecting
      if (e.cancelable) e.preventDefault()
      
      setPosition({
        x: clientX - offset.current.x,
        y: clientY - offset.current.y
      })
      
      // If moved more than a few pixels, consider it a drag
      setHasMoved(true)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false })
      window.addEventListener('touchmove', handleMove, { passive: false })
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchend', handleEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    setIsDragging(true)
    setHasMoved(false)
    
    offset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    }
  }

  return (
    <div 
      className="fixed z-50 group touch-none"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <a 
        href="#/"
        onClick={(e) => {
            if (hasMoved) e.preventDefault()
        }}
        className="flex items-center gap-0 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-foreground/20 hover:gap-3 hover:pr-6 pointer-events-none sm:pointer-events-auto"
        // pointer-events: none on wrapper a, auto on interactive children if needed? 
        // Actually, we want the button to be draggable. 
        // If we make the anchor pointer-events-none, we can't click it.
        // We handle click blocking via onClick + hasMoved.
        style={{ pointerEvents: 'auto' }} 
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-full">
            <img src="/logo.svg" alt="Fotika" className="w-6 h-6 object-contain pointer-events-none" />
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs whitespace-nowrap transition-all duration-300 font-medium opacity-0 group-hover:opacity-100 select-none">
          Create your own Gallery
        </span>
      </a>
    </div>
  )
}

function HeroHeader({ title, date, images }: { title: string, date?: string, images: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Pick up to 5 random images for the background
  const slides = React.useMemo(() => {
    // Shuffle copy
    const shuffled = [...images].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 5)
  }, [images])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides])

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : null

  return (
    <div className="relative w-full h-[50vh] flex flex-col items-center justify-center overflow-hidden bg-muted">
      {/* Background Slideshow */}
      {slides.map((img, idx) => (
        <div 
          key={img.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={img.thumbnailLink ? img.thumbnailLink.replace(/=s\d+/, '=s1600') : img.thumbnailLink} 
            alt="" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Title & Date */}
      <div className="relative z-10 text-center px-4 space-y-3">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-widest text-white drop-shadow-lg">
            {title}
        </h1>
        {formattedDate && (
            <p className="text-lg md:text-xl font-light text-gray-200 tracking-wider">
                {formattedDate}
            </p>
        )}
      </div>
    </div>
  )
}

function GallerySkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Skeleton */}
      <div className="w-full h-[50vh] bg-muted animate-pulse relative flex items-center justify-center">
        <div className="h-16 w-3/4 max-w-lg bg-muted-foreground/10 rounded-lg" />
      </div>

      {/* Grid Skeleton */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-2xl">
           <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2 mt-6">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-card rounded-xl break-inside-avoid animate-pulse mb-2 border border-border/50 shadow-sm"
                  style={{ height: `${Math.random() > 0.5 ? '300px' : '200px'}` }}
                />
              ))}
           </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function EventPage({ slug }: { slug: string }) {
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    fetchEvent(slug).then(setData)
  }, [slug])

  React.useEffect(() => {
    if (data?.event?.title) {
      document.title = `${data.event.title} - Fotika`
    }
    return () => {
      document.title = 'Fotika'
    }
  }, [data])

  if (!data) return <GallerySkeleton />
  if (data.error) return <div className="container mx-auto px-8 pt-20 text-center">Gallery not found</div>

  const images = data.images || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <HeroHeader title={data.event.title} date={data.event.eventDate} images={images} />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-2xl">
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/30 rounded-xl border border-border/50">
              <p className="text-lg font-medium">No images found</p>
              <p className="text-sm opacity-80 mt-1">This gallery is empty.</p>
            </div>
          )}
          <Gallery 
            images={images} 
            price={data.event.price} 
            paymentInfo={data.event.paymentInfo} 
            channelId={data.channelId}
            slug={slug}
          />
        </div>
      </main>

      <Footer />

      <DraggableFab />
    </div>
  )
}
