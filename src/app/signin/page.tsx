import { signIn } from "@/app/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/app/utils/dbConnect";
import UserModel from "@/app/model/User.model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              const password = String(formData.get("password") ?? "");
              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });

              if (!result?.error) {
                // ✅ NEXT AUTH BUG FIX: Session is NOT available immediately after signIn on same request
                // We fetch user directly from database instead
                await dbConnect();
                const user = await UserModel.findOne({ email });
                
                // Role based redirect - EXACT MATCH with User model enum values
                switch(user?.role) {
                  case "Doctor":
                    redirect("/dashboard/pages/Doctor");
                  case "Patient":
                    redirect("/dashboard/pages/Patient");
                  case "clientAdmin":
                    redirect("/dashboard/pages/clientAdmin");
                  case "SuperAdmin":
                    redirect("/dashboard/pages/SuperAdmin");
                  case "Admin":
                    redirect("/dashboard/pages/clientAdmin");
                  case "Receptionist":
                    redirect("/dashboard/pages/Doctor");
                  default:
                    redirect("/dashboard/pages/Doctor");
                }
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="Enter your email"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Enter your password"
                className="w-full"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
