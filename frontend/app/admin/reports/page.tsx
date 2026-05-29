'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart as BarChartIcon, TrendingUp, ShieldAlert, Loader2 } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(statsData => {
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const performanceData = [
    { name: 'Jan', value: 45 },
    { name: 'Feb', value: 51 },
    { name: 'Mar', value: 58 },
    { name: 'Apr', value: 68 },
    { name: 'May', value: stats ? Math.min(100, Math.round(stats.totalAppointments * 1.5)) : 75 },
  ]

  // Dynamic distribution calculations
  const totalItems = stats ? (stats.totalPatients + stats.totalDoctors + stats.totalHospitals + stats.totalAppointments) : 100
  const reportSources = stats ? [
    { name: 'Patients', value: Math.round((stats.totalPatients / totalItems) * 100) || 25, color: '#38bdf8' },
    { name: 'Doctors', value: Math.round((stats.totalDoctors / totalItems) * 100) || 25, color: '#a855f7' },
    { name: 'Hospitals', value: Math.round((stats.totalHospitals / totalItems) * 100) || 25, color: '#10b981' },
    { name: 'Appointments', value: Math.round((stats.totalAppointments / totalItems) * 100) || 25, color: '#f59e0b' },
  ] : [
    { name: 'Patients', value: 40, color: '#38bdf8' },
    { name: 'Doctors', value: 25, color: '#a855f7' },
    { name: 'Hospitals', value: 15, color: '#10b981' },
    { name: 'Appointments', value: 20, color: '#f59e0b' },
  ]

  if (loading) return (
    <DashboardLayout role="admin" title="Reports & Analytics" subtitle="Deep insights">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Reports & Analytics" subtitle="Deep insights into MEDOX operations and database performance.">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Partner Verification Level</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {stats && stats.totalHospitals > 0
                    ? `${Math.round((stats.verifiedHospitals / stats.totalHospitals) * 100)}%`
                    : '100%'}
                </p>
              </div>
              <ShieldAlert className="h-10 w-10 text-emerald-500" />
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Active Records Tracked</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{totalItems}</p>
              </div>
              <BarChartIcon className="h-10 w-10 text-sky-500" />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-slate-950">Appointment performance</CardTitle>
                <CardDescription className="text-slate-500">Monthly trend across all appointment pipelines.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <CardTitle className="text-base text-slate-950">Database distribution</CardTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportSources} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {reportSources.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {reportSources.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm p-5">
          <CardTitle className="text-base text-slate-950 mb-3">Live Insights</CardTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500 font-medium">Completed Appointments</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{stats?.completedAppointments ?? 0}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500 font-medium">Verified Network Partners</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{stats?.verifiedHospitals ?? 0} Hosp</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500 font-medium">Live System Revenue</p>
              <p className="mt-2 text-xl font-bold text-emerald-600">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
