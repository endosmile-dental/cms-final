import { SignIn } from "./components/auth/signin-button";
import { auth } from "./auth";
// import { SignOut } from "./components/auth/signout-button";
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
      <div className="w-full h-screen bg-[url('/signin.png')] flex flex-col gap-5 items-center justify-center bg-cover bg-center">
        <h1 className="text-6xl font-sans font-semibold">
          <span className="text-orange-500">&quot;Smart,</span>
          <span className="text-white">Simple,</span>
          <span className="text-green-600">and Secure&quot;</span>
        </h1>
        <h2 className="text-2xl tracking-wide font-sans font-medium text-white">
          The Future of Dental Practice Management!
        </h2>
        <Link href="/signup">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg tracking-wide outline-2 transition-all hover:bg-transparent hover:outline-2 hover:text-blue-600 hover:font-bold hover:outline-blue-600 hover:outline">
            Create SuperAdmin
          </button>
        </Link>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div className="w-full h-screen bg-[url('/signin.png')] bg-cover bg-center">
        <SignIn />
      </div>
    );
  }

  // ✅ Redirect user to their respective dashboard according to their role

  redirect(`/dashboard/pages/${session.user.role}`);

}
