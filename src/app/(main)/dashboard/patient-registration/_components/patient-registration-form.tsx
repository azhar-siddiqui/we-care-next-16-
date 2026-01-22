"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Age, Designation, Gender } from "@/generated/prisma/enums";
import {
  patientFormSchema,
  tempPatientRecord,
} from "@/validation/patient-registration";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  Plus,
  Save,
} from "lucide-react";
import { Fragment, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export default function PatientRegistrationForm() {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof patientFormSchema>>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      date: new Date(),
      reference: "",
      designation: Designation.Mr,
      patientName: "",
      phone: "",
      gender: Gender.Male,
      age: "",
      ageType: Age.Year,
      email: "",
      address: "",
    },
  });

  function onSubmit(data: z.infer<typeof patientFormSchema>) {
    console.log("Form Data:", data);
  }
  return (
    <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 grid-cols-12">
          <div className="w-full max-w-2xl col-span-12 xl:col-span-9">
            <h1 className="leading-none font-semibold text-2xl tracking-tight">
              Patient Registration Form
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Register the patient by entering basic personal and contact
              information to ensure accurate identification and smooth handling
              of appointments, records, and medical services.
            </p>
          </div>
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="w-full col-span-12 xl:col-span-3"
              >
                <FieldLabel htmlFor="form-date">Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="form-date"
                      className="w-full justify-between font-normal"
                    >
                      {field.value.toDateString()}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            )}
          />
          <Controller
            name="reference"
            control={form.control}
            render={({ field, fieldState }) => {
              // Find the selected doctor based on the reference ID (field.value)
              const selectedDoctor = tempPatientRecord.find(
                (item) => item.id === field.value,
              );

              return (
                <Field
                  data-invalid={fieldState.invalid}
                  className="col-span-12 xl:col-span-4"
                >
                  <FieldLabel htmlFor="form-reference">Reference</FieldLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id={id}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-invalid={fieldState.invalid}
                        className="bg-background hover:bg-background w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
                      >
                        {selectedDoctor ? (
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">
                              Dr. {selectedDoctor.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Select Doctor
                          </span>
                        )}
                        <ChevronsUpDownIcon
                          className="text-muted-foreground/80 shrink-0"
                          aria-hidden="true"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="border-input w-full min-w-(--radix-popper-anchor-width) p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search Doctor..." />
                        <CommandList>
                          <CommandEmpty>No item found.</CommandEmpty>
                          {tempPatientRecord.map((item) => (
                            <Fragment key={item.id}>
                              <CommandGroup heading={item.specialization}>
                                <CommandItem
                                  key={item.id}
                                  value={item.id} // Use ID as the value
                                  onSelect={(currentValue) => {
                                    field.onChange(currentValue); // Set the ID in the form field
                                    setOpen(false);
                                  }}
                                  className="pl-6 rounded-none"
                                >
                                  Dr. {item.name}
                                  {field.value === item.id && (
                                    <CheckIcon size={16} className="ml-auto" />
                                  )}
                                </CommandItem>
                              </CommandGroup>
                            </Fragment>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </Field>
              );
            }}
          />
          <div className="flex items-end col-span-12 xl:col-span-2">
            <Button type="button" className="w-full h-9" variant="outline">
              <Plus className="size-4" />
              Add Doctor
            </Button>
          </div>
          <Controller
            name="designation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-2"
              >
                <FieldLabel htmlFor="designation">Designation</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.values(Designation).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="patientName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-4"
              >
                <FieldLabel htmlFor="patientName">Patient Name</FieldLabel>
                <Input
                  id="patientName"
                  placeholder={
                    fieldState.error?.message ?? "Enter Patient Name"
                  }
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  autoFocus
                />
              </Field>
            )}
          />
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-4"
              >
                <FieldLabel htmlFor="form-phone">Phone Number</FieldLabel>
                <PhoneInput
                  id="form-phone"
                  placeholder={
                    fieldState.error?.message ?? "Enter Phone Number"
                  }
                  {...field}
                  defaultCountry="IN"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
              </Field>
            )}
          />
          <Controller
            name="gender"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-4"
              >
                <FieldLabel htmlFor="form-gender">Gender</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {Object.values(Gender).map((gender) => (
                    <FieldLabel
                      htmlFor={gender}
                      key={gender}
                      className="*:data-[slot=field]:py-2"
                    >
                      <Field
                        orientation="horizontal"
                        className="cursor-pointer"
                      >
                        <FieldContent>
                          <FieldTitle>{gender}</FieldTitle>
                        </FieldContent>
                        <RadioGroupItem value={gender} id={gender} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
          <Controller
            name="age"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-2"
              >
                <FieldLabel htmlFor="form-age">Age</FieldLabel>
                <Input
                  {...field}
                  id="form-age"
                  aria-invalid={fieldState.invalid}
                  placeholder={fieldState.error?.message ?? "Enter Age"}
                  autoComplete="off"
                  type="number"
                />
              </Field>
            )}
          />
          <Controller
            name="ageType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-12 xl:col-span-2"
              >
                <FieldLabel htmlFor="form-ageType">Age Type</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Age Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.values(Age).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-12">
                <FieldLabel htmlFor="form-email">Email</FieldLabel>
                <Input
                  type="email"
                  id="form-email"
                  placeholder={fieldState.error?.message ?? "Enter Email"}
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
              </Field>
            )}
          />
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-12">
                <FieldLabel htmlFor="form-address">Address</FieldLabel>
                <Textarea
                  id="form-address"
                  placeholder={
                    fieldState.error?.message ?? "Enter Patient Address"
                  }
                  className="h-26 resize-none"
                  {...field}
                />
              </Field>
            )}
          />
        </div>
      </FieldGroup>
      <Button type="submit" className="w-full sm:w-fit mt-8" disabled={false}>
        <Save className="size-4" />
        Save & Next
      </Button>
    </form>
  );
}
