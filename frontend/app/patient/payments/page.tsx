"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Wallet, Receipt, DollarSign, Eye, Loader2, IndianRupee } from "lucide-react"
import { getPayments, Payment } from "@/lib/mock-store"

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    getPayments("")
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const paidAmount = payments
    .filter((p) => (p.paymentStatus ?? p.status ?? "").toUpperCase() === "PAID")
    .reduce((s, p) => s + (p.amount || 0), 0)
  const pendingCount = payments.filter(
    (p) => (p.paymentStatus ?? p.status ?? "").toUpperCase() === "PENDING"
  ).length

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !q ||
        (p.doctor ?? "").toLowerCase().includes(q) ||
        (p.hospital ?? "").toLowerCase().includes(q)
      const status = (p.paymentStatus ?? p.status ?? "").toUpperCase()
      const matchTab = activeTab === "all" || status === activeTab
      return matchSearch && matchTab
    })
  }, [payments, searchQuery, activeTab])

  if (loading)
    return (
      <DashboardLayout role="patient">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View and manage your payment history</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{paidAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor or hospital..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
                <TabsTrigger value="PAID">Paid</TabsTrigger>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
              </TabsList>
            </Tabs>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-dashed border rounded-lg">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No payment records found</p>
              </div>
            ) : (
              filtered.map((payment) => {
                const status = (payment.paymentStatus ?? payment.status ?? "PENDING").toUpperCase()
                return (
                  <Card key={payment.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <IndianRupee className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{payment.doctor || "Doctor"}</p>
                            <p className="text-sm text-muted-foreground">{payment.treatment} — {payment.hospital}</p>
                            <p className="text-xs text-muted-foreground">{payment.date}</p>
                            {payment.transactionId && payment.transactionId !== "PAY_AT_HOSPITAL" && (
                              <p className="text-xs text-muted-foreground font-mono">TXN: {payment.transactionId}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold">₹{(payment.amount ?? 0).toLocaleString()}</p>
                          <Badge className={statusColors[status] ?? "bg-gray-100 text-gray-700"}>{status}</Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-4 w-4" />View
                            </Button>
                            {status === "PENDING" && (
                              <Button size="sm">Pay Now</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
