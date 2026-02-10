import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { getAllUsers, updateUserSettings, isSiteManager } from '../api'
import { auth } from '../firebase'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import { Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

export default function SiteManager() {
  const [loading, setLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [currentUser, setCurrentUser] = useState(auth.currentUser)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async u => {
      setCurrentUser(u)
      if (u) {
          const allowed = await isSiteManager(u.uid)
          setIsAllowed(allowed)
          if(allowed) {
             loadData()
          } else {
             setLoading(false)
          }
      } else {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  async function loadData() {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  async function handleSaveChannel(uid: string, channelId: string) {
      const toastId = toast.loading('Updating user...')
      const res = await updateUserSettings(uid, { channelId })
      if (res.ok) {
          toast.success('Channel ID Saved', { id: toastId })
          setUsers(prev => prev.map(u => u.uid === uid ? { ...u, channelId } : u))
      } else {
          toast.error('Failed to update', { id: toastId })
      }
  }

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(filter.toLowerCase()) ||
    (u.mpesaNumber || '').includes(filter)
  )

  if (loading) return <div className="p-20 text-center">Loading site manager...</div>

  // Simple protection: Check if logged in. In real app, check constraints or admin claim.
  if (!currentUser || !isAllowed) {
    return (
       <div className="min-h-screen">
         <Navbar />
         <div className="container mx-auto p-20 text-center flex flex-col items-center gap-4">
           <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full">
             <span className="text-4xl">🚫</span>
           </div>
           <h2 className="text-2xl font-bold">Access Denied</h2>
           <p className="text-muted-foreground">You do not have permission to view this page.</p>
           <a href="#/">
             <Button variant="outline">Go Home</Button>
           </a>
         </div>
       </div>
    )
 }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-7xl mx-auto pt-24 px-4 space-y-6">
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Site Manager</h1>
              <p className="text-muted-foreground">Manage payment channels for gallery owners</p>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Search users..." 
                   className="pl-8"
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                />
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Registered Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User / Email</TableHead>
                            <TableHead>M-Pesa Number</TableHead>
                            <TableHead>SwiftWallet Channel ID</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <UserRow key={user.uid} user={user} onSave={handleSaveChannel} />
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UserRow({ user, onSave }: { user: any, onSave: (id: string, cid: string) => void }) {
    const [cid, setCid] = useState(user.channelId || '')
    const hasChanged = cid !== (user.channelId || '')

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{user.email || 'No Email'}</div>
                <div className="text-xs text-muted-foreground font-mono">{user.uid}</div>
            </TableCell>
            <TableCell>
                {user.mpesaNumber ? (
                    <span className="font-mono bg-muted px-2 py-1 rounded">{user.mpesaNumber}</span>
                ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                )}
            </TableCell>
            <TableCell>
                <Input 
                    placeholder="Enter Channel ID" 
                    value={cid} 
                    onChange={e => setCid(e.target.value)}
                    className="max-w-[200px]"
                />
            </TableCell>
            <TableCell>
                <Button 
                    size="sm" 
                    variant={hasChanged ? "default" : "ghost"}
                    disabled={!hasChanged}
                    onClick={() => onSave(user.uid, cid)}
                >
                    Save
                </Button>
            </TableCell>
        </TableRow>
    )
}
