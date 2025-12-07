import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdmionOnboardingForm } from "./_components/admin-onboard-form";

export default function OnboardingAdmin() {
  return (
    <Card className="gap-4 w-full">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>
          Enter your email and password to login an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdmionOnboardingForm />
      </CardContent>
      <CardFooter className="flex flex-col justify-center space-y-2">
        <p className="text-muted-foreground px-8 text-center text-sm">
          By creating an account, you agree to our{" "}
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
