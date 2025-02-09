import { SignIn } from "./components/auth/signin-button";
import { auth } from "./auth";
import { SignOut } from "./components/auth/signout-button";
import { getSuperAdminStatus } from "./utils/globalStore";
import Link from "next/link";
import dotenv from "dotenv";
import { redirect } from "next/navigation";

export default async function Home() {
  dotenv.config();

  const isSuperAdminCreated = await getSuperAdminStatus();
  console.log(isSuperAdminCreated);

  if (!isSuperAdminCreated) {
    return (
      <div className="flex flex-col items-center p-4">
        <h1 className="text-xl font-semibold">Setup SuperAdmin</h1>
        <Link href="/signup">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Create SuperAdmin
          </button>
        </Link>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div>
        <SignIn />
      </div>
    );
  }

  // ✅ Redirect user to their respective dashboard according to their role

  redirect(`/dashboard/pages/${session.user.role}`);

  return null; // 🚀 Redirecting means no need to render anything here
}
