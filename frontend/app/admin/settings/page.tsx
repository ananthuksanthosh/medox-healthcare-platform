'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, Shield, Server, Activity, User, Key, CheckCircle2, AlertCircle, Clock, ShieldAlert, Laptop, Eye, EyeOff } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'platform' | 'activity'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile Form States (Real DB backed)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organisation, setOrganisation] = useState('MediBee Healthcare Corporation')

  // Password States (Real DB backed)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Local/Preference States
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionAlerts, setSessionAlerts] = useState(true)
  const [adminApproval, setAdminApproval] = useState(true)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(false)

  // Activity Logs Timeline Data
  const [activities] = useState([
    { id: 1, event: 'Settings modified', details: 'Updated system security configuration', ip: '192.168.1.104', time: '10 mins ago', type: 'system' },
    { id: 2, event: 'Doctor Approved', details: 'Authorized Dr. Ananya Pillai credential verification', ip: '192.168.1.104', time: '1 hour ago', type: 'doctor' },
    { id: 3, event: 'Hospital details edited', details: 'Updated address for KIMS Hospital', ip: '192.168.1.104', time: '3 hours ago', type: 'hospital' },
    { id: 4, event: 'Administrator Sign-In', details: 'Session authenticated on Windows 11 / Chrome', ip: '192.168.1.104', time: 'Yesterday, 09:12 AM', type: 'auth' },
    { id: 5, event: 'Database Backup Completed', details: 'Nightly backup successfully compiled', ip: 'System', time: 'Yesterday, 02:00 AM', type: 'system' }
  ])

  const fetchAdminProfile = async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const response = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const user = await response.json()
        setName(user.name || '')
        setEmail(user.email || '')
        setPhone(user.phone || '')
        
        // Retrieve local states if saved
        const localOrg = localStorage.getItem('medox.adminOrg')
        if (localOrg) setOrganisation(localOrg)
        
        const localMfa = localStorage.getItem('medox.adminMfa')
        setTwoFactor(localMfa === 'true')
        
        const localEmergency = localStorage.getItem('medox.adminEmergency')
        setEmergencyMode(localEmergency === 'true')
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMsg(null)
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API}/api/users/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone })
      })
      const resData = await response.json()
      if (resData.success) {
        localStorage.setItem('medox.adminOrg', organisation)
        setStatusMsg({ type: 'success', text: 'Admin profile configurations successfully synchronized.' })
      } else {
        setStatusMsg({ type: 'error', text: resData.message || 'Failed to update profile.' })
      }
    } catch (err) {
      console.error('Failed to save profile settings:', err)
      setStatusMsg({ type: 'error', text: 'Network connection error. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match!' })
      return
    }
    setSaving(true)
    setStatusMsg(null)
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const resData = await response.json()
      if (resData.success) {
        setStatusMsg({ type: 'success', text: 'Password successfully changed and secured.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setStatusMsg({ type: 'error', text: resData.message || 'Unable to update password.' })
      }
    } catch (err) {
      console.error('Failed to save password:', err)
      setStatusMsg({ type: 'error', text: 'Network connection error. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePreference = (key: string, val: boolean) => {
    if (key === 'twoFactor') {
      setTwoFactor(val)
      localStorage.setItem('medox.adminMfa', String(val))
    } else if (key === 'emergencyMode') {
      setEmergencyMode(val)
      localStorage.setItem('medox.adminEmergency', String(val))
    } else if (key === 'sessionAlerts') {
      setSessionAlerts(val)
    } else if (key === 'adminApproval') {
      setAdminApproval(val)
    } else if (key === 'maintenanceAlerts') {
      setMaintenanceAlerts(val)
    }
    setStatusMsg({ type: 'success', text: 'Platform preferences modified.' })
  }

  if (loading) return (
    <DashboardLayout role="admin" title="Admin Settings" subtitle="System Control">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Admin Settings" subtitle="Control security clearances, administrator profile, operational triggers, and access logs.">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            Admin Profile
          </button>
          <button
            onClick={() => { setActiveTab('security'); setStatusMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-primary text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Key className="h-4.5 w-4.5" />
            Security & Crypt
          </button>
          <button
            onClick={() => { setActiveTab('platform'); setStatusMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'platform'
                ? 'bg-primary text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Server className="h-4.5 w-4.5" />
            Platform Overrides
          </button>
          <button
            onClick={() => { setActiveTab('activity'); setStatusMsg(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'activity'
                ? 'bg-primary text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            Activity & Sessions
          </button>

          {/* Status Message Overlay */}
          {statusMsg && (
            <div className={`mt-6 p-4 rounded-2xl border text-xs font-semibold flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card className="border-slate-100 bg-white shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-slate-900">Administrator Profile</CardTitle>
                <CardDescription className="text-slate-400 mt-0.5">Edit credentials, official contact lines, and active organization.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl border-2 border-primary/20 shadow-md flex items-center justify-center bg-indigo-50">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120" className="object-cover h-full w-full" alt="Admin" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900">{name || 'MediBee Admin'}</h4>
                    <p className="text-xs text-indigo-600 font-bold tracking-wider uppercase">Executive Administrator</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> Activated since May 2026</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Legal Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-slate-50 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Official E-Mail</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Direct Hotline</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-slate-50 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Parent Organization</label>
                      <Input value={organisation} onChange={(e) => setOrganisation(e.target.value)} required className="bg-slate-50 rounded-xl" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-slate-50 mt-6">
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 shadow-lg shadow-indigo-50">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Sync Profile Configurations
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="border-slate-100 bg-white shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50">
                  <CardTitle className="text-lg font-bold text-slate-900">Change Cryptographic Key</CardTitle>
                  <CardDescription className="text-slate-400 mt-0.5">Ensure passwords contain special characters and are changed periodically.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Current Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="bg-slate-50 rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Min 8 characters"
                        className="bg-slate-50 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                        className="bg-slate-50 rounded-xl"
                      />
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-slate-50">
                      <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5">
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Secure New Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Advanced Security */}
              <Card className="border-slate-100 bg-white shadow-sm p-6 rounded-3xl">
                <div className="flex items-center gap-3.5 mb-5 border-b pb-4">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Advanced Account Protection</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Toggle cryptographic and credential security levels.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Multi-Factor Authentication (MFA)</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Verify login attempts using mobile authenticator devices.</p>
                    </div>
                    <Switch
                      checked={twoFactor}
                      onCheckedChange={(checked) => handleTogglePreference('twoFactor', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Suspicious Session Email Alerts</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Receive real-time logs when administrator account authenticates from new devices.</p>
                    </div>
                    <Switch
                      checked={sessionAlerts}
                      onCheckedChange={(checked) => handleTogglePreference('sessionAlerts', checked)}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* OVERRIDES TAB */}
          {activeTab === 'platform' && (
            <Card className="border-slate-100 bg-white shadow-sm p-6 rounded-3xl">
              <div className="flex items-center gap-3.5 mb-5 border-b pb-4">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-500">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">System Overrides & Controls</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage operational features and global overrides.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Manual Doctor Registration Approval</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Require executive admin approval before new doctors appear in patient searches.</p>
                  </div>
                  <Switch
                    checked={adminApproval}
                    onCheckedChange={(checked) => handleTogglePreference('adminApproval', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-2xl bg-red-50/20 p-4 border border-red-100">
                  <div>
                    <p className="font-bold text-red-900 text-sm flex items-center gap-1.5"><ShieldAlert className="h-4.5 w-4.5 text-red-500" /> Platform Crisis Override (Emergency Mode)</p>
                    <p className="text-xs text-red-700 mt-0.5 font-semibold">Toggling this will suspend all appointment bookings and block patient-facing API queries instantly.</p>
                  </div>
                  <Switch
                    checked={emergencyMode}
                    onCheckedChange={(checked) => handleTogglePreference('emergencyMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Maintenance Warning Alerts</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Broadcast system-wide notices regarding planned database backup operations.</p>
                  </div>
                  <Switch
                    checked={maintenanceAlerts}
                    onCheckedChange={(checked) => handleTogglePreference('maintenanceAlerts', checked)}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <Card className="border-slate-100 bg-white shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-slate-900">Activity Timeline & Logs</CardTitle>
                <CardDescription className="text-slate-400 mt-0.5">Real-time audit log of changes made by administrative clearances.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-full border-collapse">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="px-6 py-4 font-bold text-slate-700">Administrative Event</TableHead>
                        <TableHead className="px-4 py-4 font-bold text-slate-700">Modification details</TableHead>
                        <TableHead className="px-4 py-4 font-bold text-slate-700">Client IP</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-slate-700 text-right">Timeline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((act) => (
                        <TableRow key={act.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${
                                act.type === 'auth' ? 'bg-emerald-500' :
                                act.type === 'hospital' ? 'bg-sky-500' :
                                act.type === 'doctor' ? 'bg-indigo-500' : 'bg-slate-400'
                              }`} />
                              <span className="font-bold text-slate-900 text-sm">{act.event}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-xs font-semibold text-slate-500">{act.details}</TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge className="bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-50 gap-1 inline-flex font-mono text-[10px]">
                              <Laptop className="h-3 w-3" />
                              {act.ip}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right text-xs font-bold text-slate-400">{act.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </DashboardLayout>
  )
}
