import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Camera, User, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { auth, signOutUser } from '../firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { isSiteManager } from '../api'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const allowed = await isSiteManager(currentUser.uid)
        setCanManage(allowed)
      } else {
        setCanManage(false)
      }
    })

    // Click outside listener for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
      unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    window.location.hash = '/'
    setIsDropdownOpen(false)
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "bg-transparent border-transparent"
    )}>
      <div className="flex h-16 items-center justify-between px-6 lg:px-8 mx-auto max-w-7xl">
        <a href="#/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Fotika" className="w-8 h-8" />
        </a>
        <div className="flex items-center gap-3">
          {user && (
            <a href="#/create" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block mr-2">
              Create Gallery
            </a>
          )}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-hidden"
              >
                <span className="text-sm font-semibold text-primary">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 space-y-1">
                     <div className="px-2 py-1.5 text-sm font-semibold truncate border-b border-border/50 mb-1 pb-2">
                      {user.displayName || user.email || 'Account'}
                    </div>
                    <a 
                      href="#/dashboard" 
                      className="flex items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      My Dashboard
                    </a>
                    {/* Check if user is a Site Manager */}
                    {canManage && (
                      <a 
                        href="#/admin" 
                        className="flex items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-blue-500"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Panel
                      </a>
                    )}
                    <a 
                      href="#/create" 
                      className="flex md:hidden items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Create Gallery
                    </a>
                    <a 
                      href="#/settings" 
                      className="flex items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </a>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center px-2 py-2 text-sm rounded-sm hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <a href="#/auth">Sign in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
