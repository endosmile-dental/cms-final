"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
// import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards"; // kept for future static cards edits
import { useAppSelector } from "@/app/redux/store/hooks";
import { store } from "@/app/redux/store/store";
import { fetchProfile, ProfileData } from "@/app/redux/slices/profileSlice";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Download,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

/*
const toggleButtonClass =
  "h-8 rounded-full px-4 text-xs font-medium transition-colors";
*/

const mapProfileToForm = (profileData: ProfileData) => ({
  name: profileData?.fullName || "",
  phone: profileData?.contactNumber || "",
  address: {
    street: profileData?.address?.street || "",
    city: profileData?.address?.city || "",
    state: profileData?.address?.state || "",
    postalCode: profileData?.address?.postalCode || "",
  },
});

export default function ProfileSettings() {
  const { data: session } = useSession();

  const userProfile = useAppSelector(
    (state) => state?.profile?.profile as ProfileData
  );

  const [profile, setProfile] = useState(() => mapProfileToForm(userProfile));
  const [hasEditedProfile, setHasEditedProfile] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  /*
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    appointmentReminders: true,
    marketingEmails: false,
    twoFactorAuth: false,
    sessionTimeout: "30 mins",
  });
  */

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (!userProfile && session?.user?.id) {
      store.dispatch(fetchProfile({ userId: session.user.id, role: "Doctor" }));
    }
  }, [session?.user?.id, userProfile]);

  useEffect(() => {
    if (!userProfile || hasEditedProfile) return;
    setProfile(mapProfileToForm(userProfile));
  }, [hasEditedProfile, userProfile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHasEditedProfile(true);
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  /*
  const handleToggle = (key: keyof typeof settings) => {
    if (key === "sessionTimeout") return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  */

  const handleManualBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus("idle");
      setBackupMessage(null);

      const res = await fetch("/api/manualBackup", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Backup failed");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "backup.zip";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setBackupStatus("success");
      setBackupMessage("Backup created and downloaded successfully.");
    } catch {
      setBackupStatus("error");
      setBackupMessage("Backup failed. Please try again.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const profileCompletion = [
    profile.name,
    profile.phone,
    profile.address.street,
    profile.address.city,
    profile.address.state,
    profile.address.postalCode,
  ].filter(Boolean).length;

  const completionPercent = Math.round((profileCompletion / 6) * 100);

  /*
  const activePreferences = [
    settings.emailAlerts,
    settings.smsAlerts,
    settings.appointmentReminders,
    settings.marketingEmails,
    settings.twoFactorAuth,
  ].filter(Boolean).length;

  // Static dashboard summary cards (display-only, no click actions or persistence yet).
  const stats: Stat[] = [
    {
      title: "Profile Health",
      value: `%`,
      subtitle: "Fields completed",
      icon: <Activity className="h-4 w-4" />,
      color: "bg-emerald-500",
      trend: completionPercent >= 80 ? "up" : "neutral",
    },
    {
      title: "Active Alerts",
      value: activePreferences.toString(),
      subtitle: "Notification rules on",
      icon: <Bell className="h-4 w-4" />,
      color: "bg-sky-500",
      trend: "neutral",
    },
    {
      title: "Security",
      value: settings.twoFactorAuth ? "Strong" : "Basic",
      subtitle: settings.twoFactorAuth ? "2FA enabled" : "Enable 2FA",
      icon: <Shield className="h-4 w-4" />,
      color: "bg-violet-500",
      trend: settings.twoFactorAuth ? "up" : "down",
    },
    {
      title: "Backup",
      value: backupStatus === "success" ? "Ready" : "Pending",
      subtitle: "Manual export status",
      icon: <Database className="h-4 w-4" />,
      color: "bg-fuchsia-500",
      trend: backupStatus === "success" ? "up" : "neutral",
    },
  ];
  */

  return (
    <DashboardLayout>
      <div className="p-6 min-h-screen space-y-6">
        <div className="rounded-2xl border border-sky-200/70 dark:border-sky-900/50 bg-gradient-to-r from-sky-100/80 via-cyan-50 to-violet-100/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="mt-2 text-muted-foreground">
                Manage profile details, communication preferences, security, and
                backups.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="px-3 py-1 bg-sky-100 text-sky-700 border border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50"
              >
                Doctor Workspace
              </Badge>
              <Badge
                variant={completionPercent >= 80 ? "default" : "outline"}
                className="px-3 py-1"
              >
                {completionPercent >= 80 ? "All Set" : "Needs Attention"}
              </Badge>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-medium text-foreground">
                {completionPercent}%
              </span>
            </div>
            <Progress
              value={completionPercent}
              color={completionPercent >= 80 ? "bg-green-500" : "bg-amber-500"}
            />
          </div>
        </div>
        {/* Static summary cards hidden for now; kept for future edits.
        <DashboardCards stats={stats} />
        */}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-2 h-auto gap-2 p-1 border border-border rounded-xl bg-gradient-to-r from-sky-100/80 via-violet-100/80 to-emerald-100/80 dark:from-sky-900/20 dark:via-violet-900/20 dark:to-emerald-900/20">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Profile
            </TabsTrigger>
            {/* Static Preferences tab hidden for now; kept for future edits.
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              Preferences
            </TabsTrigger>
            */}
            {/* Static Security tab hidden for now; kept for future edits.
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              Security
            </TabsTrigger>
            */}
            <TabsTrigger
              value="backup"
              className="data-[state=active]:bg-fuchsia-500 data-[state=active]:text-white"
            >
              Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="border-sky-200/60 dark:border-sky-900/50 shadow-sm bg-gradient-to-br from-sky-50/80 to-background dark:from-sky-950/20 dark:to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Keep your contact and clinic location details current.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showSuccess && (
                  <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    Profile updated successfully.
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
                      <Input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="pl-9 border-sky-200/70 focus-visible:ring-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Phone</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
                      <Input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="pl-9 border-sky-200/70 focus-visible:ring-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Street</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
                      <Input
                        type="text"
                        name="address.street"
                        value={profile.address.street}
                        onChange={handleChange}
                        className="pl-9 border-sky-200/70 focus-visible:ring-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">City</label>
                    <Input
                      type="text"
                      name="address.city"
                      value={profile.address.city}
                      onChange={handleChange}
                      className="border-sky-200/70 focus-visible:ring-sky-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">State</label>
                    <Input
                      type="text"
                      name="address.state"
                      value={profile.address.state}
                      onChange={handleChange}
                      className="border-sky-200/70 focus-visible:ring-sky-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Postal Code</label>
                    <Input
                      type="text"
                      name="address.postalCode"
                      value={profile.address.postalCode}
                      onChange={handleChange}
                      className="border-sky-200/70 focus-visible:ring-sky-400"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="submit"
                      className="gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
                    >
                      <Save className="h-4 w-4" />
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Static preference toggles for UI feedback only; not persisted to backend yet.
          <TabsContent value="preferences" className="space-y-4">
            <Card className="border-emerald-200/60 dark:border-emerald-900/50 shadow-sm bg-gradient-to-br from-emerald-50/80 to-background dark:from-emerald-950/20 dark:to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-emerald-600" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive updates from the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    key: "emailAlerts",
                    label: "Email alerts",
                    desc: "Appointment and payment updates by email.",
                  },
                  {
                    key: "smsAlerts",
                    label: "SMS alerts",
                    desc: "Receive urgent notifications over SMS.",
                  },
                  {
                    key: "appointmentReminders",
                    label: "Appointment reminders",
                    desc: "Auto reminders before scheduled visits.",
                  },
                  {
                    key: "marketingEmails",
                    label: "Product announcements",
                    desc: "Feature launches and product tips.",
                  },
                ].map((item) => {
                  const key = item.key as keyof typeof settings;
                  const enabled = Boolean(settings[key]);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-white/80 dark:bg-background/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={enabled}
                        onClick={() => handleToggle(key)}
                        className={`${toggleButtonClass} ${
                          enabled
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {enabled ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> On
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <X className="h-3.5 w-3.5" /> Off
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
          */}
          {/* Static security controls for now; state resets on refresh until API wiring is added.
          <TabsContent value="security" className="space-y-4">
            <Card className="border-violet-200/60 dark:border-violet-900/50 shadow-sm bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/20 dark:to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-600" />
                  Security Controls
                </CardTitle>
                <CardDescription>
                  Improve account protection and access safety.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-violet-200/60 dark:border-violet-900/40 bg-white/80 dark:bg-background/60 px-4 py-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Two-factor authentication</p>
                      <p className="text-xs text-muted-foreground">
                        Add an extra verification step when signing in.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={settings.twoFactorAuth}
                      onClick={() => handleToggle("twoFactorAuth")}
                      className={`${toggleButtonClass} ${
                        settings.twoFactorAuth
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {settings.twoFactorAuth ? "Enabled" : "Enable"}
                    </button>
                  </div>
                  <Progress
                    value={settings.twoFactorAuth ? 90 : 55}
                    color={settings.twoFactorAuth ? "bg-violet-500" : "bg-amber-500"}
                  />
                </div>

                <div className="rounded-lg border border-violet-200/60 dark:border-violet-900/40 bg-white/80 dark:bg-background/60 px-4 py-3">
                  <p className="text-sm font-medium">Session timeout</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current inactivity timeout: {settings.sessionTimeout}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "15 mins",
                      "30 mins",
                      "60 mins",
                      "2 hours",
                    ].map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={
                          settings.sessionTimeout === option
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={
                          settings.sessionTimeout === option
                            ? "bg-violet-500 hover:bg-violet-600 text-white"
                            : "border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300"
                        }
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            sessionTimeout: option,
                          }))
                        }
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          */}

          <TabsContent value="backup" className="space-y-4">
            <Card className="border-fuchsia-200/60 dark:border-fuchsia-900/50 shadow-sm bg-gradient-to-br from-fuchsia-50/80 to-background dark:from-fuchsia-950/20 dark:to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-fuchsia-600" />
                  Backup and Data Management
                </CardTitle>
                <CardDescription>
                  Download a manual backup snapshot of clinic data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-fuchsia-200/60 dark:border-fuchsia-900/40 bg-white/80 dark:bg-background/60 px-4 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Manual backup export</p>
                      <p className="text-xs text-muted-foreground">
                        Generates and downloads a ZIP archive.
                      </p>
                    </div>
                    <Button
                      onClick={handleManualBackup}
                      disabled={isBackingUp}
                      className="gap-2 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:from-fuchsia-600 hover:to-violet-600"
                    >
                      <Download className="h-4 w-4" />
                      {isBackingUp ? "Creating Backup..." : "Create Backup"}
                    </Button>
                  </div>

                  {backupMessage && (
                    <div
                      className={`mt-4 rounded-md px-3 py-2 text-sm ${
                        backupStatus === "success"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {backupMessage}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
