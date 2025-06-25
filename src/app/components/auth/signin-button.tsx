import { signIn } from "@/app/auth";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
      className="w-full h-screen flex flex-col items-center justify-center text-white"
    >
      <h1 className="text-7xl font-bold tracking-wide">CMS</h1>
      <h2 className="text-xl mb-10">A complete clinic solution</h2>
      <button
        type="submit"
        className="p-2 rounded-lg bg-white hover:bg-black/50 hover:text-white text-black transition-colors duration-300"
      >
        Sign in
      </button>
    </form>
  );
}
