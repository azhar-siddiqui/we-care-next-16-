import { Card, CardContent } from "@/components/ui/card";
import PatientRegistrationForm from "./_components/patient-registration-form";

export default function PatientRegistration() {
  return (
    <div className="w-full">
      <Card>
        <CardContent className="w-full p-4">
          <PatientRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
