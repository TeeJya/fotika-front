import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { getUserSettings, updateUserSettings } from '../api'
import { auth } from '../firebase'
import { toast } from 'sonner'
import { Save, CreditCard, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mpesaNumber, setMpesaNumber] = useState('')
  const [user, setUser] = useState(auth.currentUser)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u)
      if (u) loadSettings(u.uid)
      else setLoading(false)
    })
    return () => unsub()
  }, [])

  async function loadSettings(uid: string) {
    const data = await getUserSettings(uid)
    if (data && data.mpesaNumber) {
      setMpesaNumber(data.mpesaNumber)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    const res = await updateUserSettings(user.uid, { mpesaNumber })
    setSaving(false)

    if (res.ok) {
      toast.success('Settings saved successfully')
    } else {
      toast.error('Failed to save settings')
    }
  }

  if (loading) return <div className="p-10 text-center">Loading settings...</div>

  if (!user) {
     return (
        <div className="min-h-screen">
          <Navbar />
          <div className="container mx-auto p-10 text-center">
            Please log in to manage settings.
          </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl mx-auto pt-24 pb-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <CreditCard className="w-5 h-5" /> Payment Configuration
            </CardTitle>
            <CardDescription>
              Set up your payment details to receive money from paid gallery downloads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">M-Pesa Phone Number / Till Number</label>
                <div className="flex gap-2">
                    <span className="flex items-center justify-center bg-muted border border-r-0 rounded-l-md px-3 text-muted-foreground text-sm font-mono">
                       +254
                    </span>
                    <Input 
                        value={mpesaNumber}
                        onChange={e => setMpesaNumber(e.target.value)}
                        placeholder="7XX..."
                        className="rounded-l-none"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                  This number will be shown to customers when they try to purchase your photos.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <a href="#/create">
                    <Button variant="outline" type="button">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                 </a>
                 <Button type="submit" disabled={saving}>
                   {saving ? (
                     'Saving...'
                   ) : (
                     <>
                       <Save className="w-4 h-4 mr-2" /> Save Changes
                     </>
                   )}
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
