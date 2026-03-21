import { SignIn } from "./components/auth/signin-button";
import { auth } from "./auth";
import { getSuperAdminStatus } from "./utils/globalStore";
import Link from "next/link";
import dotenv from "dotenv";
import { redirect } from "next/navigation";

export default async function Home() {
  dotenv.config();

  const isSuperAdminCreated = await getSuperAdminStatus();

  if (!isSuperAdminCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex flex-col items-center justify-center p-4">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 md:p-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent text-center leading-tight">
                  Smart, Simple, and Secure
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  The Future of Dental Practice Management
                </h2>
              </div>

              <div className="pt-4">
                <Link href="/signup">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800">
                    <span className="relative z-10">Create SuperAdmin</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
              </div>

              <div className="flex justify-center space-x-8 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Enterprise Ready
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  HIPAA Compliant
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Cloud Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
        <div className="relative z-10">
          <SignIn />
        </div>
      </div>
    );
  }

  // ✅ Redirect user to their respective dashboard according to their role
  redirect(`/dashboard/pages/${session.user.role}`);
}
