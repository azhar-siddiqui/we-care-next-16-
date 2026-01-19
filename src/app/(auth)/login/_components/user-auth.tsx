"use client";

import Link from "next/link";
import { HTMLAttributes, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { loginInApiAction } from "@/actions/auth/login";
import { loginInSchema } from "@/validation/auth/login";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({
  className,
  ...props
}: Readonly<UserAuthFormProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof loginInSchema>>({
    resolver: zodResolver(loginInSchema),
    defaultValues: {
      email: "weCareKeyAdmin7558@gmail.com",
      password: "WeCareKeyAdmin@7558",
    },
  });

  function onSubmit(value: z.infer<typeof loginInSchema>) {
    startTransition(async () => {
      const response = await loginInApiAction(value);
      if (response.success) {
        form.reset();
        toast.success(`${response.message}`);
        router.push("/dashboard/default");
      } else {
        toast.error(`${response.message}`);
      }
    });
  }

  return (
    <form id="form-login" onSubmit={form.handleSubmit(onSubmit)} {...props}>
      <FieldGroup className={cn("grid gap-6", className)}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-email">Email</FieldLabel>
              <Input
                {...field}
                id="form-email"
                aria-invalid={fieldState.invalid}
                placeholder="Jhon@we-care.com"
                autoComplete="off"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="form-password"
                aria-invalid={fieldState.invalid}
                placeholder="********"
                autoComplete="off"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between ">
          <div className="hidden sm:flex items-center space-x-2 group cursor-pointer">
            <Switch
              id="remember-me"
              className="cursor-pointer"
              disabled={isPending}
            />
            <Label htmlFor="remember-me" className="text-sm cursor-pointer">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-muted-foreground text-sm hover:opacity-75 hover:text-primary hover:underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={isPending}>
          {isPending && <LoaderCircle className="size-4 animate-spin" />}
          Login
        </Button>
      </div>
    </form>
  );
}
