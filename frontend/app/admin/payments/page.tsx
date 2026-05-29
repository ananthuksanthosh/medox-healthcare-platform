'use client'

import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CreditCard, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    Promise.all([
      fetch(`${API}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([payData, statsData]) => {
      if (payData.success && payData.data && Array.isArray(payData.data.payments)) {
        const formatted = payData.data.payments.map((p: any) => ({
          id: p.id,
          description: `${p.patientName || 'Patient'} → ${p.doctor || 'Doctor'} (${p.treatment || 'Consultation'})`,
          date: p.date,
          method: p.method || p.paymentMethod || 'Online',
          amount: `₹${p.amount.toLocaleString()}`,
          status: (p.status || p.paymentStatus || 'Completed').toLowerCase() === 'paid' ? 'Completed' : 'Processing'
        }))
        setPaymentsList(formatted)
      }
      if (statsData.success && statsData.data) {
        setStats(statsData.data)
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filteredPayments = useMemo(() => {
    return paymentsList.filter((payment) =>
      payment.description.toLowerCase().includes(search.toLowerCase()) ||
      payment.method.toLowerCase().includes(search.toLowerCase()) ||
      payment.status.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, paymentsList])

  const statusColors: Record<string, string> = {
    Completed: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
    Processing: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
    Refunded: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
  }

  const revenueString = stats ? `₹${(stats.totalRevenue ?? 0).toLocaleString()}` : '₹0'

  if (loading) return (
    <DashboardLayout role="admin" title="Payment Monitoring" subtitle="System records">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Payment Monitoring" subtitle="Review revenue, invoices, and transaction health.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <CreditCard className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total revenue</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{revenueString}</p>
              </div>
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <ArrowUpRight className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Transactions</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{paymentsList.length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <ArrowDownRight className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Failed / Refund Transactions</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">0</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Invoice history and transaction review.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search payments by doctor, method, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base text-slate-950">Transaction History</CardTitle>
            <CardDescription className="text-slate-500">Monitor every payment move inside MEDOX.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Table className="min-w-full border-separate border-spacing-0">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="px-5 py-3">Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="px-5 py-3 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                      No payment transactions found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-slate-50">
                      <TableCell className="text-slate-950 font-medium px-5 py-3">{payment.description}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="font-semibold text-slate-950">{payment.amount}</TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Badge className={statusColors[payment.status] || 'bg-gray-50 text-slate-700'}>{payment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
