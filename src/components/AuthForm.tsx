import React from 'react'
import { sendMagicLink as sendLink, signInWithGoogle } from '../firebase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'

interface AuthFormProps {
  onSuccess?: () => void
  view?: 'modal' | 'page'
}

export default function AuthForm({ onSuccess, view = 'page' }: AuthFormProps) {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState('')

  async function onGoogle() {
    try {
      await signInWithGoogle()
      setStatus('signed')
      toast.success('Signed in with Google')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Google sign in failed')
      setStatus('error')
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await sendLink(email)
      setStatus('sent')
      toast.success('Magic link sent! Check your email.')
    } catch (err) {
      console.error(err)
      setStatus('error')
      toast.error('Failed to send magic link')
    }
  }

  return (
    <div className={view === 'modal' ? "border rounded-lg p-6" : "space-y-6"}>
      <div className="space-y-6">
        <Button variant="outline" className="w-full h-12 text-base relative group hover:bg-primary/5 hover:border-primary/30 transition-all" onClick={onGoogle} type="button">
          <svg className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground font-medium">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={onSend} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email address
            </label>
            <Input 
              id="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              type="email"
              required
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-medium" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>
        {status === 'sent' && (
          <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Magic link sent! Check your inbox.</span>
          </div>
        )}
        {status === 'signed' && (
          <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>You're signed in!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg text-red-800 dark:text-red-200 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Failed to sign in. Please try again.</span>
          </div>
        )}
      </div>
    </div>
  )
}
