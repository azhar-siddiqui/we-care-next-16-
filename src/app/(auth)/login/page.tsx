import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <Card className="gap-4 max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">Login</CardTitle>
        <CardDescription>
          Enter your email and password below to{" "}
          <br className="hidden sm:block" />
          log into your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col justify-center space-y-2">
        <p className="text-sm">
          Dont have an account?{" "}
          <Link
            href="/sign-up"
            className="text-muted-foreground text-sm hover:opacity-75 hover:text-primary hover:underline underline-offset-4 transition ease-in-out duration-150"
          >
            Sign up now
          </Link>
        </p>
        <p className="text-muted-foreground px-8 text-center text-sm">
          By clicking login, you agree to our{" "}
          <a
            href="/terms"
            className="hover:text-primary underline underline-offset-4"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="hover:text-primary underline underline-offset-4"
          >
            Privacy Policy
          </a>{" "}
          .
        </p>
      </CardFooter>
    </Card>
  );
}
