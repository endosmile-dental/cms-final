"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if SuperAdmin exists on mount
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const res = await fetch("/api/auth/checkSuperAdmin");
        const data = await res.json();
        console.log("data.superAdminExists", data);

        if (data.superAdminExists) {
          // If SuperAdmin exists, redirect to sign in
          router.push("/api/auth/signin");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error checking superAdmin status:", error.message);
          setError(error.message || "An unexpected error occurred");
        } else {
          console.error("An unexpected error occurred");
        }
      }
    };

    checkSuperAdmin();
  }, [router]);

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError("");

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: "SuperAdmin",
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Something went wrong");
      }

      // ✅ Redirect to Sign In page after successful signup
      router.push("/api/auth/signin");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        console.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create SuperAdmin</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Set up your SuperAdmin account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
                className="w-full"
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                className="w-full"
              />
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword", {
                  required: "Confirm Password is required",
                })}
                className="w-full"
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? "Creating..." : "Create SuperAdmin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
