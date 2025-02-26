"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
          // Optionally set a form error
          // setFormError(error.message || "An unexpected error occurred");
        } else {
          console.error("An unexpected error occurred");
          // setFormError("An unexpected error occurred");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Signup Page</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            {...register("email", { required: "Email is required" })}
            className="border rounded px-3 py-2"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
            className="border rounded px-3 py-2"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", {
              required: "Confirm Password is required",
            })}
            className="border rounded px-3 py-2"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create SuperAdmin"}
          </button>
        </form>
      </div>
    </div>
  );
}
