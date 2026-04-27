import { signIn } from "@/app/auth";
import Image from "next/image";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center text-white"
    >
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/CMS-signin.png"
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content (Centered) */}
      <div className="w-full flex items-start md:pl-20">
        <div className="flex flex-col items-start text-center px-4">
          <h1 className="text-4xl md:text-8xl font-bold tracking-wide">Clims</h1>
          <h2 className="text-sm md:text-xl font-semibold mb-10">
            A complete clinic solution
          </h2>

          <button
            type="submit"
            className="px-3 py-1 md:px-6 md:py-2 rounded-lg bg-white text-black hover:bg-black/50 hover:text-white transition-colors duration-300"
          >
            Sign in
          </button>
        </div>
      </div>

    </form>
  );
}
