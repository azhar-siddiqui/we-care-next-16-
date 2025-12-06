export enum Role {
  KEY_ADMIN = "KEY_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  DOCTOR = "DOCTOR",
  PATIENT = "PATIENT",
}
export interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
}

export const user = {
  id: "sample-id",
  name: "Azhar Siddiqui",
  email: "azhartsiddiqui@gmail.com",
  role: Role.KEY_ADMIN,
};

export const users = [
  {
    id: "sample-id",
    name: "Azhar Siddiqui",
    email: "azhartsiddiqui@gmail.com",
    role: Role.KEY_ADMIN,
  },
  {
    id: "sample-id-2",
    name: "Ammar Khan",
    email: "ammar@ammarkhnz.com",
    role: Role.ADMIN,
  },
];
