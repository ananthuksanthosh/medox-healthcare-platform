'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bell } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminNotificationsPage() {
  const [announcement, setAnnouncement] = useState('')
  const [subject, setSubject] = useState('')
  const [targetRole, setTargetRole] = useState('ALL')
  const [notificationsList, setNotificationsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchNotifications = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setNotificationsList(data)
      }
    } catch (err) {
      console.error('Failed to load notifications history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !announcement) return
    setSending(true)
    setSuccessMsg('')
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API}/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: subject,
          message: announcement,
          role: targetRole
        })
      })
      const resData = await response.json()
      if (resData.success) {
        setSuccessMsg(`Successfully broadcasted alert to ${targetRole.toLowerCase()}s.`)
        setSubject('')
        setAnnouncement('')
        fetchNotifications()
      }
    } catch (err) {
      console.error('Failed to send broadcast:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <DashboardLayout role="admin" title="Notifications" subtitle="Announcements">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Notifications" subtitle="Send announcements and review recent alerts.">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base text-slate-950">Broadcast Announcement</CardTitle>
            <CardDescription className="text-slate-500">Deliver critical notifications and system updates directly to profiles.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Alert Title</label>
                  <Input
                    placeholder="Alert title"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Accounts (Universal)</option>
                    <option value="DOCTOR">Doctor Accounts Only</option>
                    <option value="PATIENT">Patient Accounts Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Message Details</label>
                <Textarea
                  placeholder="Type the announcement details here..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  required
                  rows={5}
                />
              </div>

              {successMsg && (
                <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                  {successMsg}
                </p>
              )}

              <Button type="submit" disabled={sending} className="gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send announcement
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base text-slate-950">Notification logs</CardTitle>
            <CardDescription className="text-slate-500">Recent announcements delivered across the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 max-h-[400px] overflow-y-auto">
            {notificationsList.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">No notification logs recorded.</p>
              </div>
            ) : (
              notificationsList.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-950 text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                    </div>
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50 font-normal capitalize">
                      {notification.targetRole?.toLowerCase() || 'global'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 font-medium">{notification.time}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
