import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AdmionOnboardingForm } from "./admin-onboard-form";

export default function AdminOnboardDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg tracking-tight">
            Create an account
          </DialogTitle>
          <DialogDescription>
            Enter your email and password to login an account.
          </DialogDescription>
        </DialogHeader>

        <AdmionOnboardingForm />
      </DialogContent>
    </Dialog>
  );
}
