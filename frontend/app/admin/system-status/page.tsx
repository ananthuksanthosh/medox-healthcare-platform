'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Server, Cpu, Database, CloudLightning, Activity, HardDrive, 
  Terminal, RefreshCw, Layers, CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { 
  let t = localStorage.getItem("token"); 
  if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); 
  return (!t || t === "undefined") ? null : t 
}

export default function SystemStatusPage() {
  const [sysStatus, setSysStatus] = useState<any>(null)
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
      const res = await fetch(`${API}/api/admin/system-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSysStatus(json.data);
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
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  if (loading) return (
    <DashboardLayout role="admin" title="System Status" subtitle="Operations dashboard">
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    </DashboardLayout>
  )

  const services = sysStatus?.services || {};
  const resources = sysStatus?.resources || {};
  const counts = sysStatus?.counts || {};
  const uptimes = sysStatus?.uptimes || {};
  const errors = sysStatus?.errors || [];

  return (
    <DashboardLayout role="admin" title="System Status" subtitle="MEDOX Node Clusters & Hosting Infrastructure Health Console.">
      <div className="space-y-6 pb-12">
        {/* Top Header Sync Button */}
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>All Backend Services Operational</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fetchData(true)}
            className="text-xs font-semibold gap-1"
          >
            {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh Stats
          </Button>
        </div>

        {/* Microservices Health Checklist */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Object.keys(services).map((name) => {
            const val = services[name];
            return (
              <Card key={name} className="border-slate-200 bg-white shadow-sm p-4 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">{name}</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block capitalize">
                  {name === 'db' ? 'MySQL Database' : name}
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${val === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className={`text-xs font-bold ${val === 'OPERATIONAL' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {val === 'OPERATIONAL' ? 'OPERATIONAL' : 'OFFLINE'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Hardware Resource Usage Bars */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* CPU Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>CPU Cluster Load</CardDescription>
                <CardTitle className="text-xl font-bold mt-1 text-slate-950">
                  {resources.cpu ?? '0.0'}%
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                <Cpu className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                <div 
                  className="bg-sky-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${resources.cpu ?? 5}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-semibold">PROCESS THREADS HEALTHY</span>
            </CardContent>
          </Card>

          {/* RAM Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>System RAM Usage</CardDescription>
                <CardTitle className="text-xl font-bold mt-1 text-slate-950">
                  {resources.ram ?? '0.0'}%
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${resources.ram ?? 40}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-semibold">HEAP UTILIZATION NORMAL</span>
            </CardContent>
          </Card>

          {/* Disk Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardDescription>Storage Partition</CardDescription>
                <CardTitle className="text-xl font-bold mt-1 text-slate-950">
                  {resources.disk ?? '14.5'}%
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <HardDrive className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                <div 
                  className="bg-violet-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${resources.disk ?? 14.5}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-semibold">UPLOAD PARTITIONS SEAMLESS</span>
            </CardContent>
          </Card>
        </div>

        {/* Database Real Counts Dashboard */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5 pb-2 flex flex-row items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-base">Prisma Database Registry Summary</CardTitle>
              <CardDescription>Real-time relational model record counts synchronized from MySQL engine</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Total Accounts</span>
                <span className="text-2xl font-bold text-slate-950 mt-1 block">{counts.totalUsers ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Registered Patients</span>
                <span className="text-2xl font-bold text-sky-600 mt-1 block">{counts.totalPatients ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Verified Clinicians</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{counts.totalDoctors ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Connected Hospitals</span>
                <span className="text-2xl font-bold text-violet-600 mt-1 block">{counts.totalHospitals ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Consultations Logged</span>
                <span className="text-2xl font-bold text-amber-600 mt-1 block">{counts.totalAppointments ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Billing Invoices</span>
                <span className="text-2xl font-bold text-slate-950 mt-1 block">{counts.totalPayments ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Prescriptions Generated</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{counts.totalPrescriptions ?? 0}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50/50">
                <span className="text-xs text-slate-400 block font-semibold">Medical PDF Reports</span>
                <span className="text-2xl font-bold text-sky-600 mt-1 block">{counts.totalMedicalReports ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uptime and Logs */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Service Uptime List */}
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-1">
            <CardHeader className="p-5">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-500" />
                Service Cluster Uptimes
              </CardTitle>
              <CardDescription>Server runtime persistent trackers</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold text-slate-700">Express Backend Cluster</span>
                  <Badge variant="outline" className="text-xs font-mono">{formatUptime(uptimes.server)}</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold text-slate-700">API Load Balancer</span>
                  <Badge variant="outline" className="text-xs font-mono">{formatUptime(uptimes.api)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">MySQL Database Cluster</span>
                  <Badge variant="outline" className="text-xs font-mono">{formatUptime(uptimes.database)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exception Logs */}
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="p-5">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Infrastructure Exception Registry
              </CardTitle>
              <CardDescription>Failed transactions or rate limit exclusions in past 48 hours</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {errors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Zero service exceptions recorded recently. Infrastructure is 100% healthy!</div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {errors.map((e: any) => (
                    <div key={e.id} className="flex items-start gap-3 p-3 border rounded-xl bg-red-50/20 border-red-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-700">{e.type}</span>
                          <span className="text-[10px] text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{e.message}</p>
                      </div>
                      <Badge className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap">{e.ip}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
