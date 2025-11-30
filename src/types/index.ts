export enum Role {
  KEY_ADMIN = "KEY_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  DOCTOR = "DOCTOR",
  PATIENT = "PATIENT",
}

export interface User {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  role: Role;
  avtaar: string;
  createdAt: Date;
  updateAt: Date;
}
