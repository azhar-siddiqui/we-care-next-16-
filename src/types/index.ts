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
  role: Role;
}

export const user = {
  id: "sample-id",
  name: "Azhar Siddiqui",
  email: "azhartsiddiqui@gmail.com",
  role: Role.KEY_ADMIN,
};
