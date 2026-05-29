"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  CreditCard,
  Smartphone,
  Globe,
  Trash2,
  Download,
  AlertCircle,
  Heart,
  Activity,
  Ruler,
  Scale,
  Cigarette,
  Wine,
  Dumbbell,
  Pill,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  FileHeart,
  Loader2
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showMedicalSaveSuccess, setShowMedicalSaveSuccess] = useState(false)
  // LOAD PATIENT PROFILE ON MOUNT
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let token = localStorage.getItem("token")
        if (!token || token === "undefined" || token === "null") {
          token = localStorage.getItem("medox.authToken")
        }
        if (!token || token === "undefined" || token === "null") return

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (res.ok) {
          const user = await res.json()

          const names = (user.name || "").split(" ")
          const firstName = names[0] || ""
          const lastName = names.slice(1).join(" ") || ""

          setProfile(prev => ({
            ...prev,
            firstName,
            lastName,
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dob ? user.dob.split("T")[0] : "",
            gender: user.gender ? user.gender.toLowerCase() : "",
            address: user.address || "",
            city: "",
            state: "",
            pincode: "",
            emergencyContact: "",
            emergencyName: "",
            emergencyRelation: "",
          }))

          if (user.profilePic) {
            const pic = user.profilePic.startsWith("http")
              ? user.profilePic
              : `http://localhost:5000/${user.profilePic}`
            setAvatarUrl(pic)
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err)
      }
    }
    loadProfile()
  }, [])

  const handleDeleteAccount = async () => {
    // Client-side validation before hitting the server
    if (deleteConfirmation.trim() !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: 'Please type DELETE exactly to confirm',
        variant: "destructive"
      })
      return
    }

    if (!deletePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your current password",
        variant: "destructive"
      })
      return
    }

    try {
      setIsDeleting(true)
      let token = localStorage.getItem("token")
      if (!token || token === "undefined" || token === "null") {
        token = localStorage.getItem("medox.authToken")
      }

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "User token not found. Please log in again.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/delete-account",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            password: deletePassword,
            confirmText: deleteConfirmation.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Delete Failed",
          description: data.message || "Something went wrong",
          variant: "destructive"
        })
        setDeletePassword("")
        return
      }

      // Clear local storage and sign out
      signOut()

      setIsDeleteDialogOpen(false)
      setDeleteConfirmation("")
      setDeletePassword("")

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })

      router.push("/")
    } catch (error) {
      console.error(error)
      toast({
        title: "Network Error",
        description: "Could not reach the server. Check your connection.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState("/placeholder-avatar.jpg")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      setAvatarUrl(url)

      try {
        const token = localStorage.getItem("token") || localStorage.getItem("medox.authToken")
        if (!token) return

        const formData = new FormData()
        formData.append("photo", file)

        const res = await fetch("http://localhost:5000/api/users/upload-profile-photo", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          toast({ title: "Photo Uploaded", description: "Your profile photo has been updated." })
          
          if (data.success && data.data?.user?.profilePic) {
            const newPic = data.data.user.profilePic.startsWith("http")
              ? data.data.user.profilePic
              : `http://localhost:5000/${data.data.user.profilePic}`
            setAvatarUrl(newPic)
          }
        } else {
          toast({ title: "Upload Failed", description: "Failed to save profile photo to server.", variant: "destructive" })
        }
      } catch (err) {
        console.error("Avatar upload error:", err)
        toast({ title: "Upload Error", description: "Something went wrong.", variant: "destructive" })
      }
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true)
      let token = localStorage.getItem("token")
      if (!token || token === "undefined" || token === "null") {
        token = localStorage.getItem("medox.authToken")
      }
      if (!token) {
        toast({ title: "Authentication Error", description: "Session token not found.", variant: "destructive" })
        return
      }

      const res = await fetch("http://localhost:5000/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gender: profile.gender ? profile.gender.toUpperCase() : undefined,
          dob: profile.dateOfBirth || null,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Update Failed", description: data.message || "Something went wrong.", variant: "destructive" })
        return
      }

      // Re-fetch to refresh all fields in form
      const refreshed = await fetch("http://localhost:5000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (refreshed.ok) {
        const user = await refreshed.json()
        const names = (user.name || "").split(" ")
        setProfile(prev => ({
          ...prev,
          firstName: names[0] || "",
          lastName: names.slice(1).join(" ") || "",
          email: user.email || "",
          phone: user.phone || "",
          dateOfBirth: user.dob ? user.dob.split("T")[0] : "",
          gender: user.gender ? user.gender.toLowerCase() : "",
          address: user.address || "",
        }))
      }

      setShowSaveSuccess(true)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Something went wrong updating profile.", variant: "destructive" })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdatePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" })
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "Error", description: "New password and confirm password do not match.", variant: "destructive" })
      return
    }
    try {
      setIsUpdatingPassword(true)
      let token = localStorage.getItem("token")
      if (!token || token === "undefined" || token === "null") {
        token = localStorage.getItem("medox.authToken")
      }
      if (!token) {
        toast({ title: "Authentication Error", description: "Session token not found.", variant: "destructive" })
        return
      }

      const res = await fetch("http://localhost:5000/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      })

      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Update Failed", description: data.message || "Failed to update password.", variant: "destructive" })
        return
      }

      setPasswordForm({ current: "", new: "", confirm: "" })
      toast({ title: "Password Updated", description: "Your password has been changed successfully." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Something went wrong updating password.", variant: "destructive" })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const [billingAddress, setBillingAddress] = useState({
    name: "",
    street: "",
    city: "",
    stateAndPin: ""
  })
  const [isEditingBilling, setIsEditingBilling] = useState(false)
  const [isSavingBilling, setIsSavingBilling] = useState(false)

  const handleSaveBilling = async () => {
    setIsSavingBilling(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSavingBilling(false)
    setIsEditingBilling(false)
    toast({ title: "Address Saved", description: "Your billing address has been updated." })
  }

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    appointments: true,
    prescriptions: true,
    promotions: false,
  })

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContact: "",
    emergencyName: "",
    emergencyRelation: "",
  })

  const [medicalDetails, setMedicalDetails] = useState({
    height: "",
    heightUnit: "cm",
    weight: "",
    weightUnit: "kg",
    maritalStatus: "",
    occupation: "",
    // Chronic conditions
    isDiabetic: false,
    diabetesType: "",
    diabetesSince: "",
    isHypertensive: false,
    hypertensionSince: "",
    hasHeartDisease: false,
    heartCondition: "",
    hasThyroid: false,
    thyroidType: "",
    hasAsthma: false,
    hasCancer: false,
    cancerType: "",
    hasKidneyDisease: false,
    hasLiverDisease: false,
    // Lifestyle
    smokingStatus: "",
    alcoholConsumption: "",
    exerciseFrequency: "",
    dietType: "",
    // Allergies
    hasDrugAllergies: false,
    drugAllergies: "",
    hasFoodAllergies: false,
    foodAllergies: "",
    hasOtherAllergies: false,
    otherAllergies: "",
    // Medical history
    pastSurgeries: "",
    currentMedications: "",
    familyHistory: "",
    // Insurance
    hasInsurance: false,
    insuranceProvider: "",
    policyNumber: "",
    policyValidTill: "",
  })

  const [isSavingMedical, setIsSavingMedical] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("medox.medicalDetails")
      if (stored) {
        setMedicalDetails(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load medical details:", e)
    }
  }, [])

  const handleSaveMedicalDetails = async () => {
    try {
      setIsSavingMedical(true)
      await new Promise(resolve => setTimeout(resolve, 600))
      localStorage.setItem("medox.medicalDetails", JSON.stringify(medicalDetails))
      setShowMedicalSaveSuccess(true)
    } catch (e) {
      toast({
        title: "Save Failed",
        description: "Could not save health profiles.",
        variant: "destructive"
      })
    } finally {
      setIsSavingMedical(false)
    }
  }

  return (
    <>
      {/* ── Save Success Popup ── */}
      <Dialog open={showSaveSuccess} onOpenChange={setShowSaveSuccess}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Profile Saved!</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Your profile information has been updated successfully.
            </DialogDescription>
          </DialogHeader>
          <Button className="mt-2 w-full" onClick={() => setShowSaveSuccess(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Medical Save Success Popup ── */}
      <Dialog open={showMedicalSaveSuccess} onOpenChange={setShowMedicalSaveSuccess}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Medical Details Saved!</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Your health profile and medical history have been updated successfully.
            </DialogDescription>
          </DialogHeader>
          <Button className="mt-2 w-full" onClick={() => setShowMedicalSaveSuccess(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>

      <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile photo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {`${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-10"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        className="pl-10"
                        value={profile.dateOfBirth}
                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(value) => setProfile({ ...profile, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={profile.bloodGroup}
                      onValueChange={(value) => setProfile({ ...profile, bloodGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      className="pl-10 min-h-[80px]"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Emergency Contact</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input
                        id="emergencyName"
                        value={profile.emergencyName}
                        onChange={(e) => setProfile({ ...profile, emergencyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelation">Relationship</Label>
                      <Select
                        value={profile.emergencyRelation}
                        onValueChange={(value) => setProfile({ ...profile, emergencyRelation: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Friend">Friend</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Contact Number</Label>
                      <Input
                        id="emergencyContact"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Details Tab */}
          <TabsContent value="medical" className="space-y-6">
            {/* Physical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Physical Information
                </CardTitle>
                <CardDescription>Your basic physical measurements and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="height"
                          type="number"
                          className="pl-10"
                          value={medicalDetails.height}
                          onChange={(e) => setMedicalDetails({ ...medicalDetails, height: e.target.value })}
                        />
                      </div>
                      <Select
                        value={medicalDetails.heightUnit}
                        onValueChange={(value) => setMedicalDetails({ ...medicalDetails, heightUnit: value })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="ft">ft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="weight"
                          type="number"
                          className="pl-10"
                          value={medicalDetails.weight}
                          onChange={(e) => setMedicalDetails({ ...medicalDetails, weight: e.target.value })}
                        />
                      </div>
                      <Select
                        value={medicalDetails.weightUnit}
                        onValueChange={(value) => setMedicalDetails({ ...medicalDetails, weightUnit: value })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={medicalDetails.maritalStatus}
                      onValueChange={(value) => setMedicalDetails({ ...medicalDetails, maritalStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={medicalDetails.occupation}
                      onChange={(e) => setMedicalDetails({ ...medicalDetails, occupation: e.target.value })}
                    />
                  </div>
                </div>
                {/* BMI Display */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Calculated BMI</p>
                      <p className="text-2xl font-bold text-primary">
                        {medicalDetails.height && medicalDetails.weight
                          ? (Number(medicalDetails.weight) / Math.pow(Number(medicalDetails.height) / 100, 2)).toFixed(1)
                          : "--"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-sm font-medium text-green-600">Normal Weight</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chronic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Chronic Conditions
                </CardTitle>
                <CardDescription>Select any long-term health conditions you have</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diabetes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Diabetes</p>
                        <p className="text-sm text-muted-foreground">Chronic blood sugar condition</p>
                      </div>
                    </div>
                    <Switch
                      checked={medicalDetails.isDiabetic}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, isDiabetic: checked })}
                    />
                  </div>
                  {medicalDetails.isDiabetic && (
                    <div className="ml-13 pl-4 border-l-2 border-orange-200 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={medicalDetails.diabetesType}
                          onValueChange={(value) => setMedicalDetails({ ...medicalDetails, diabetesType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="type1">Type 1</SelectItem>
                            <SelectItem value="type2">Type 2</SelectItem>
                            <SelectItem value="gestational">Gestational</SelectItem>
                            <SelectItem value="prediabetes">Pre-diabetes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Since When</Label>
                        <Input
                          type="date"
                          value={medicalDetails.diabetesSince}
                          onChange={(e) => setMedicalDetails({ ...medicalDetails, diabetesSince: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hypertension */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Hypertension (High Blood Pressure)</p>
                        <p className="text-sm text-muted-foreground">Elevated blood pressure condition</p>
                      </div>
                    </div>
                    <Switch
                      checked={medicalDetails.isHypertensive}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, isHypertensive: checked })}
                    />
                  </div>
                  {medicalDetails.isHypertensive && (
                    <div className="ml-13 pl-4 border-l-2 border-red-200">
                      <div className="space-y-2 max-w-xs">
                        <Label>Since When</Label>
                        <Input
                          type="date"
                          value={medicalDetails.hypertensionSince}
                          onChange={(e) => setMedicalDetails({ ...medicalDetails, hypertensionSince: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Heart Disease */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                        <FileHeart className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium">Heart Disease</p>
                        <p className="text-sm text-muted-foreground">Cardiovascular conditions</p>
                      </div>
                    </div>
                    <Switch
                      checked={medicalDetails.hasHeartDisease}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasHeartDisease: checked })}
                    />
                  </div>
                  {medicalDetails.hasHeartDisease && (
                    <div className="ml-13 pl-4 border-l-2 border-pink-200">
                      <div className="space-y-2">
                        <Label>Condition Details</Label>
                        <Input
                          placeholder="e.g., Coronary Artery Disease, Arrhythmia"
                          value={medicalDetails.heartCondition}
                          onChange={(e) => setMedicalDetails({ ...medicalDetails, heartCondition: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Other conditions in grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium">Thyroid Disorder</span>
                    </div>
                    <Switch
                      checked={medicalDetails.hasThyroid}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasThyroid: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Asthma / COPD</span>
                    </div>
                    <Switch
                      checked={medicalDetails.hasAsthma}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasAsthma: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="font-medium">Kidney Disease</span>
                    </div>
                    <Switch
                      checked={medicalDetails.hasKidneyDisease}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasKidneyDisease: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">Liver Disease</span>
                    </div>
                    <Switch
                      checked={medicalDetails.hasLiverDisease}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasLiverDisease: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Allergies
                </CardTitle>
                <CardDescription>Important allergy information for your safety</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Drug / Medication Allergies</Label>
                    <Switch
                      checked={medicalDetails.hasDrugAllergies}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasDrugAllergies: checked })}
                    />
                  </div>
                  {medicalDetails.hasDrugAllergies && (
                    <Textarea
                      placeholder="List medications you are allergic to (e.g., Penicillin, Sulfa drugs, Aspirin)"
                      value={medicalDetails.drugAllergies}
                      onChange={(e) => setMedicalDetails({ ...medicalDetails, drugAllergies: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Food Allergies</Label>
                    <Switch
                      checked={medicalDetails.hasFoodAllergies}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasFoodAllergies: checked })}
                    />
                  </div>
                  {medicalDetails.hasFoodAllergies && (
                    <Textarea
                      placeholder="List foods you are allergic to (e.g., Peanuts, Shellfish, Dairy)"
                      value={medicalDetails.foodAllergies}
                      onChange={(e) => setMedicalDetails({ ...medicalDetails, foodAllergies: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Other Allergies</Label>
                    <Switch
                      checked={medicalDetails.hasOtherAllergies}
                      onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasOtherAllergies: checked })}
                    />
                  </div>
                  {medicalDetails.hasOtherAllergies && (
                    <Textarea
                      placeholder="List other allergies (e.g., Latex, Pollen, Dust mites)"
                      value={medicalDetails.otherAllergies}
                      onChange={(e) => setMedicalDetails({ ...medicalDetails, otherAllergies: e.target.value })}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Lifestyle
                </CardTitle>
                <CardDescription>Your lifestyle habits that may affect health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Cigarette className="h-4 w-4" />
                      Smoking Status
                    </Label>
                    <Select
                      value={medicalDetails.smokingStatus}
                      onValueChange={(value) => setMedicalDetails({ ...medicalDetails, smokingStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never Smoked</SelectItem>
                        <SelectItem value="former">Former Smoker</SelectItem>
                        <SelectItem value="occasional">Occasional Smoker</SelectItem>
                        <SelectItem value="regular">Regular Smoker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Wine className="h-4 w-4" />
                      Alcohol Consumption
                    </Label>
                    <Select
                      value={medicalDetails.alcoholConsumption}
                      onValueChange={(value) => setMedicalDetails({ ...medicalDetails, alcoholConsumption: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="occasionally">Occasionally</SelectItem>
                        <SelectItem value="socially">Socially</SelectItem>
                        <SelectItem value="regularly">Regularly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Exercise Frequency
                    </Label>
                    <Select
                      value={medicalDetails.exerciseFrequency}
                      onValueChange={(value) => setMedicalDetails({ ...medicalDetails, exerciseFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (No exercise)</SelectItem>
                        <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-4 days/week)</SelectItem>
                        <SelectItem value="active">Active (5+ days/week)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Diet Type</Label>
                    <Select
                      value={medicalDetails.dietType}
                      onValueChange={(value) => setMedicalDetails({ ...medicalDetails, dietType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="eggetarian">Eggetarian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileHeart className="h-5 w-5 text-primary" />
                  Medical History
                </CardTitle>
                <CardDescription>Past surgeries, current medications, and family history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pastSurgeries">Past Surgeries / Major Procedures</Label>
                  <Textarea
                    id="pastSurgeries"
                    placeholder="List any surgeries or major medical procedures (e.g., Appendectomy 2015, Knee Replacement 2020)"
                    value={medicalDetails.pastSurgeries}
                    onChange={(e) => setMedicalDetails({ ...medicalDetails, pastSurgeries: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentMedications" className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Current Medications
                  </Label>
                  <Textarea
                    id="currentMedications"
                    placeholder="List all medications you are currently taking (e.g., Metformin 500mg twice daily)"
                    value={medicalDetails.currentMedications}
                    onChange={(e) => setMedicalDetails({ ...medicalDetails, currentMedications: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familyHistory">Family Medical History</Label>
                  <Textarea
                    id="familyHistory"
                    placeholder="List any significant medical conditions in your family (e.g., Father - Diabetes, Mother - Hypertension)"
                    value={medicalDetails.familyHistory}
                    onChange={(e) => setMedicalDetails({ ...medicalDetails, familyHistory: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Insurance Information
                </CardTitle>
                <CardDescription>Your health insurance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Do you have health insurance?</Label>
                  <Switch
                    checked={medicalDetails.hasInsurance}
                    onCheckedChange={(checked) => setMedicalDetails({ ...medicalDetails, hasInsurance: checked })}
                  />
                </div>
                {medicalDetails.hasInsurance && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input
                        id="insuranceProvider"
                        value={medicalDetails.insuranceProvider}
                        onChange={(e) => setMedicalDetails({ ...medicalDetails, insuranceProvider: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policyNumber">Policy Number</Label>
                      <Input
                        id="policyNumber"
                        value={medicalDetails.policyNumber}
                        onChange={(e) => setMedicalDetails({ ...medicalDetails, policyNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="policyValidTill">Policy Valid Till</Label>
                      <Input
                        id="policyValidTill"
                        type="date"
                        className="max-w-xs"
                        value={medicalDetails.policyValidTill}
                        onChange={(e) => setMedicalDetails({ ...medicalDetails, policyValidTill: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveMedicalDetails}
                disabled={isSavingMedical}
              >
                {isSavingMedical ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Medical Details
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={passwordForm.current}
                      onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={passwordForm.new}
                    onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">SMS Authentication</p>
                      <p className="text-sm text-muted-foreground">Receive codes via SMS</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Chrome on Windows</p>
                      <p className="text-sm text-muted-foreground">Kochi, Kerala - Current session</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <Button variant="outline" className="w-full">Sign out all other sessions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>Select which notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Appointment Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming appointments</p>
                  </div>
                  <Switch
                    checked={notifications.appointments}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, appointments: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Prescription Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications about new prescriptions and refills</p>
                  </div>
                  <Switch
                    checked={notifications.prescriptions}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, prescriptions: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotional Updates</p>
                    <p className="text-sm text-muted-foreground">Health tips and promotional offers</p>
                  </div>
                  <Switch
                    checked={notifications.promotions}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">Allow doctors to view your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Share Medical History</p>
                    <p className="text-sm text-muted-foreground">Allow sharing history with new doctors</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics & Improvement</p>
                    <p className="text-sm text-muted-foreground">Help us improve by sharing usage data</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Download or delete your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Download Your Data</p>
                    <p className="text-sm text-muted-foreground">Get a copy of all your medical records</p>
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                  <div>
                    <p className="font-medium text-red-700">Delete Account</p>
                    <p className="text-sm text-red-600">Permanently delete your account and data</p>
                  </div>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                          This action is permanent and cannot be undone. All appointments, reports and personal data may be permanently removed.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-confirm">
                            Type <span className="font-bold select-none">DELETE</span> to confirm
                          </Label>
                          <Input
                            id="delete-confirm"
                            placeholder="DELETE"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            disabled={isDeleting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">Current Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="delete-password"
                              type={showDeletePassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              disabled={isDeleting}
                            />
                            <button
                              type="button"
                              onClick={() => setShowDeletePassword(!showDeletePassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              disabled={isDeleting}
                            >
                              {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== "DELETE" || !deletePassword || isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting account...
                            </>
                          ) : (
                            "Delete My Account"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">**** **** **** 4532</p>
                      <p className="text-sm text-muted-foreground">Expires 08/2028</p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add New Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
                <CardDescription>Address used for billing purposes</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingBilling ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={billingAddress.name} onChange={e => setBillingAddress({...billingAddress, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Street</Label>
                      <Input value={billingAddress.street} onChange={e => setBillingAddress({...billingAddress, street: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>State & PIN</Label>
                      <Input value={billingAddress.stateAndPin} onChange={e => setBillingAddress({...billingAddress, stateAndPin: e.target.value})} />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveBilling} disabled={isSavingBilling}>
                        {isSavingBilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingBilling(false)} disabled={isSavingBilling}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg border">
                      <p className="font-medium">{billingAddress.name}</p>
                      <p className="text-sm text-muted-foreground">{billingAddress.street}</p>
                      <p className="text-sm text-muted-foreground">{billingAddress.city}</p>
                      <p className="text-sm text-muted-foreground">{billingAddress.stateAndPin}</p>
                    </div>
                    <Button variant="outline" className="mt-4" onClick={() => setIsEditingBilling(true)}>Edit Address</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </>
  )
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className || "bg-primary/10 text-primary"}`}>
      {children}
    </span>
  )
}
