import React from 'react'
import { Instagram, Twitter, Linkedin } from 'lucide-react'

export default function Footer(){
  return (
    <footer className="mt-auto py-8">
      <div className="w-full mx-auto px-4 lg:px-[180px]">
        <div className="border-t border-border mb-8"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Fotika" className="w-6 h-6" />
            </div>
            
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#/privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#/terms" className="hover:text-primary transition-colors">Terms</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>

        </div>
        
        <div className="mt-8 text-center md:text-left text-xs text-muted-foreground">
          <div className="mt-2 flex items-center justify-center md:justify-start gap-4">
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <span className="opacity-50">•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <span className="opacity-50">•</span>
            <a href="/security" className="hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
