"use client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { onboardAdminApiAction } from "@/actions/auth/onboard-admin";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { onboardAdminSchema as formSchema } from "@/validation/auth/register";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";

export default function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      labName: "medicare",
      ownerName: "Azhar",
      email: "azhartsiddiqui@gmail.com",
      password: "qwer1234",
      contactNumber: "",
      previousSoftware: "patho",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        console.log("Form data submitted:", data);
        const response = await onboardAdminApiAction(data);
        if (response.success) {
          toast.success(`${response.message}`);
          router.push(`/verify?email=${encodeURIComponent(data.email)}`);
          form.reset();
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.log("An error occurred===>", error);
        toast.error(`Failed to submit the form. Please try again. ${error}`);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid grid-cols-1 gap-4 md:grid-cols-4")}
      >
        <FormField
          control={form.control}
          name="labName"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Lab Name</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    form.formState.errors.labName?.message ?? "HealthLab"
                  }
                  {...field}
                  autoComplete="off"
                  autoFocus
                  className={cn(
                    form.formState.errors.labName && "placeholder:text-red-400",
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ownerName"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Owner Name</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    form.formState.errors.ownerName?.message ?? "John Doe"
                  }
                  {...field}
                  className={cn(
                    form.formState.errors.ownerName &&
                      "placeholder:text-red-400",
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    form.formState.errors.email?.message ?? "name@example.com"
                  }
                  {...field}
                  className={cn(
                    form.formState.errors.email && "placeholder:text-red-400",
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder={
                    form.formState.errors.password?.message ?? "********"
                  }
                  inputClassName={cn(
                    form.formState.errors.password &&
                      "placeholder:text-red-400 border border-red-400",
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactNumber"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder={
                    form.formState.errors.contactNumber?.message ??
                    "Enter Contact Number"
                  }
                  {...field}
                  defaultCountry="IN"
                  autoComplete="off"
                  className={cn(
                    "rounded-none",
                    form.formState.errors.contactNumber &&
                      "placeholder:text-red-400",
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousSoftware"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Previous Software</FormLabel>
              <FormControl>
                <Input
                  placeholder="LabSoftwareX"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-2 md:col-span-4"
          disabled={isPending}
        >
          {isPending && <LoaderCircle className="size-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
