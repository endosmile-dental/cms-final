import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { signInSchema } from "./lib/signinZod";
import dbConnect from "./utils/dbConnect";
import UserModel from "./model/User.model";

// Your own logic for dealing with plaintext password strings; be careful!

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // ✅ Connect to the database
          await dbConnect();

          // ✅ Validate credentials using Zod
          const { email, password } =
            await signInSchema.parseAsync(credentials);

          // ✅ Fetch the user from the DB by email
          const user = await UserModel.findOne({ email });

          // ✅ Check if user exists
          if (!user) {
            throw new Error("Invalid credentials.");
          }

          // ✅ Validate the password using the model method
          const isPasswordValid = await user.matchPassword(password);
          if (!isPasswordValid) {
            throw new Error("Invalid credentials.");
          }

          // ✅ (Optional) Update the lastLogin field
          user.lastLogin = new Date();
          await user.save();

          // ✅ Return the user object (omit sensitive fields as needed)
          return {
            id: user._id,
            name: user.email.split("@")[0], // or use a real name field if available
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            console.error("Validation Error:", error.errors);
            return null; // Ensure it returns `null` explicitly on validation failure
          }
          console.error("Authorization Error:", error);
          return null; // Fallback: return `null` if any error occurs
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
