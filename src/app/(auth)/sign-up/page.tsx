import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import SignUpForm from "./_components/sign-up-form";

export default function SignUpPage() {
  return (
    <Card className="gap-4 w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>
          Enter your details below to create your account
          <br className="hidden sm:block" />
          and get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="flex flex-col justify-center space-y-2">
        <p className="text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className=" text-muted-foreground text-sm hover:opacity-75 hover:text-primary hover:underline underline-offset-4 transition ease-in-out duration-150"
          >
            Login
          </Link>
        </p>
        <p className="text-muted-foreground px-8 text-center text-sm">
          If you already have an account.
        </p>
      </CardFooter>
    </Card>
  );
}
