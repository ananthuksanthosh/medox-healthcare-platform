'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ShieldAlert, ShieldCheck, Shield, AlertTriangle, 
  Terminal, Search, RefreshCw, Eye, History, Lock, UserX, Loader2
} from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { 
  let t = localStorage.getItem("token"); 
  if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); 
  return (!t || t === "undefined") ? null : t 
}

export default function SecurityCenterPage() {
  const [secStats, setSecStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const token = getToken()
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Build logs query
      let logsUrl = `${API}/api/admin/security-logs?page=${page}&limit=50`
      if (searchTerm) logsUrl += `&search=${encodeURIComponent(searchTerm)}`
      if (severityFilter) logsUrl += `&severity=${severityFilter}`
      if (statusFilter) logsUrl += `&status=${statusFilter}`

      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API}/api/admin/security-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(logsUrl, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const statsJson = await statsRes.json();
      const logsJson = await logsRes.json();

      if (statsJson.success && statsJson.data) {
        setSecStats(statsJson.data);
      }
      if (logsJson.success && logsJson.data) {
        setLogs(logsJson.data.logs || []);
        setLogsTotal(logsJson.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, severityFilter, statusFilter]);

  const triggerSearch = () => {
    setPage(1);
    fetchData();
  };

  const getSeverityBadge = (sev: string) => {
    const s = String(sev).toUpperCase();
    if (s === 'CRITICAL') return <Badge className="bg-red-500 hover:bg-red-600 text-white font-mono border-none">CRITICAL</Badge>;
    if (s === 'WARNING' || s === 'MEDIUM') return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono border-none">WARNING</Badge>;
    return <Badge className="bg-slate-500 hover:bg-slate-600 text-white font-mono border-none">INFO</Badge>;
  };

  const getStatusBadge = (st: string) => {
    const s = String(st).toUpperCase();
    if (s === 'SUCCESS') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">SUCCESS</Badge>;
    if (s === 'FAILURE' || s === 'FAILED') return <Badge className="bg-red-50 text-red-700 border-red-200">FAILED</Badge>;
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200">BLOCKED</Badge>;
  };

  if (loading) return (
    <DashboardLayout role="admin" title="Security Center" subtitle="Operations dashboard">
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    </DashboardLayout>
  )

  const overallScore = secStats?.healthScore?.overallScore ?? 100;

  return (
    <DashboardLayout role="admin" title="Security Center" subtitle="MEDOX Threat Intelligence & Cybersecurity Operations Console.">
      <div className="space-y-6 pb-12">
        {/* Security Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Health Gauge Card */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <CardDescription>Security Health</CardDescription>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {overallScore >= 90 ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                )}
                System Secure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-center items-center py-6">
              <div className="relative flex items-center justify-center">
                {/* SVG circular progress */}
                <svg className="h-28 w-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="56" cy="56" r="48" 
                    stroke={overallScore >= 90 ? "#10b981" : overallScore >= 75 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * overallScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-slate-900">{overallScore}%</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">HEALTH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failed Logins */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>Failed Logins Today</CardDescription>
                <CardTitle className="text-3xl font-bold mt-1 text-slate-950">
                  {secStats?.failedLoginsToday ?? 0}
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 text-red-500">
                <UserX className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                Auth checks active across platform APIs
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>Suspicious / Blocked</CardDescription>
                <CardTitle className="text-3xl font-bold mt-1 text-slate-950">
                  {secStats?.blockedRequests ?? 0}
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                {secStats?.rateLimitedRequests ?? 0} rate limit triggers today
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>Active Logged Users</CardDescription>
                <CardTitle className="text-3xl font-bold mt-1 text-slate-950">
                  {secStats?.activeSessions ?? 1}
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-500">
                <History className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {secStats?.securityEventsToday ?? 0} audited events today
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts Banner */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 flex gap-3 items-start">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-950">Cybersecurity Alerts</h4>
            <p className="text-xs text-red-700 mt-0.5">
              {secStats?.failedLoginsToday > 5 
                ? "WARNING: Elevate system checks. Multiple invalid login patterns detected today." 
                : "System threat levels are currently LOW. Symmetric JWT parsing & Bcrypt validations are operating correctly."
              }
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchData(true)}
            className="text-red-700 hover:bg-red-100 text-xs font-semibold gap-1"
          >
            {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Sync
          </Button>
        </div>

        {/* 2 Column Logs / Failed Logins */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Failed Logins List */}
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-1">
            <CardHeader className="p-5">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-500" />
                Failed Logins Audit
              </CardTitle>
              <CardDescription>Last 10 invalid credentials inputs</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {(!secStats?.failedLoginsList || secStats.failedLoginsList.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">Zero failed login attempts. Great password hygiene!</div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto">
                  {secStats.failedLoginsList.map((f: any) => (
                    <div key={f.id} className="border-b pb-3 last:border-none last:pb-0">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs text-slate-700 font-bold break-all block max-w-[150px]">{f.userEmail}</span>
                        <span className="text-[10px] text-slate-400">{new Date(f.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                        <span>IP: {f.ipAddress}</span>
                        <span>•</span>
                        <span>{f.device}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Activity Logs */}
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="p-5">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-500" />
                Administrative Logs
              </CardTitle>
              <CardDescription>Recent profile settings, creations, settings modifications</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {(!secStats?.adminActivityLogs || secStats.adminActivityLogs.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">No administrative changes recorded recently</div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto">
                  {secStats.adminActivityLogs.map((a: any) => (
                    <div key={a.id} className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 py-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{a.eventType}</Badge>
                          <span className="text-xs font-semibold text-slate-700">{a.userEmail}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{a.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(a.timestamp).toLocaleDateString()} {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-time System Security Logs Table */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">Operations Log Center</CardTitle>
            <CardDescription>Real-time searchable registry of all platform security logs</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {/* Filter Section */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search email, IP, details..."
                  className="pl-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                />
              </div>
              <select
                className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-800"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <select
                className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-800"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
              <Button size="sm" onClick={triggerSearch} className="text-xs">Filter</Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">User Email</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No logs match your filter criteria</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', { hour12: false })}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800">{log.eventType}</span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate">{log.userEmail || 'System'}</td>
                        <td className="p-3 font-mono text-slate-500">{log.ipAddress}</td>
                        <td className="p-3">{getSeverityBadge(log.severity)}</td>
                        <td className="p-3">{getStatusBadge(log.status)}</td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate" title={log.details}>
                          {log.details || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsTotal > 50 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-slate-400 text-xs">Total Logs: {logsTotal}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={logs.length < 50}
                    onClick={() => setPage(p => p + 1)}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
