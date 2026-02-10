import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getUserEvents, deleteEvent } from '../api'
import { auth } from '../firebase'
import { toast } from 'sonner'
import { Eye, ExternalLink, Trash2, Calendar, Image as ImageIcon, Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [user, setUser] = useState(auth.currentUser)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u)
      if (u) loadData(u.uid)
      else setLoading(false)
    })
    return () => unsub()
  }, [])

  async function loadData(uid: string) {
    const data = await getUserEvents(uid)
    // Sort by recent first
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setEvents(data)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
      if(!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return

      const toastId = toast.loading('Deleting gallery...')
      const res = await deleteEvent(id)
      
      if (res.ok) {
          setEvents(prev => prev.filter(e => e.id !== id))
          toast.success('Gallery deleted', { id: toastId })
      } else {
          toast.error('Failed to delete', { id: toastId })
      }
  }

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>

  if (!user) {
    return (
       <div className="min-h-screen">
         <Navbar />
         <div className="container mx-auto p-10 text-center">
           Please log in to view dashboard.
         </div>
       </div>
    )
 }

  const totalGalleries = events.length
  // Placeholder stats - in real app we'd track these
  const totalViews = events.reduce((acc, curr) => acc + (curr.views || 0), 0)
  const totalRevenue = events.reduce((acc, curr) => acc + (curr.revenue || 0), 0) // Placeholder

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-7xl mx-auto pt-24 pb-10 px-4 space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <a href="#/create">
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> New Gallery
                </Button>
            </a>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Galleries</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGalleries}</div>
              <p className="text-xs text-muted-foreground">Active events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">Across all galleries</p>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (Est)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalRevenue}</div>
              <p className="text-xs text-muted-foreground">From manual reports</p>
            </CardContent>
          </Card> */} 
          {/* Commenting out revenue for now as we don't track it properly yet */}
        </div>

        {/* Gallery List */}
        <Card>
            <CardHeader>
                <CardTitle>Your Galleries</CardTitle>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        You haven't created any galleries yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Images</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        {event.title}
                                        <div className="text-xs text-muted-foreground md:hidden">
                                           {new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="mr-2 h-3 w-3" />
                                            {event.eventDate || new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.price > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                                            {event.price > 0 ? `Paid (KES ${event.price})` : 'Free'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{event.images?.length || 0}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <a href={`#/e/${event.slug}`} target="_blank" rel="noreferrer">
                                            <Button variant="ghost" size="icon" title="View Public Page">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(event.id, event.title)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Delete Gallery"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
