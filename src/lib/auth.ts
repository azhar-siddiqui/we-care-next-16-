import { LoggedInUser, Role } from "@/types";
import bcrypt from "bcryptjs";
import * as jose from "jose";
// import crypto from "node:crypto";
import { env } from "./env";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function generateToken(
  loggedInUser: LoggedInUser
): Promise<string> {
  const token = await new jose.SignJWT({
    loggedInUser,
    // randomBlock: crypto.randomBytes(512).toString("hex"),
    // issuedAtMillis: Date.now(),
    // version: "v1",
    // extraInfo: crypto.randomBytes(256).toString("base64"),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT
export async function verifyToken(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jose.jwtVerify<Record<string, unknown>>(
      token,
      JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );
    return payload;
  } catch (error) {
    console.error("ERR: on auth.ts", error);
    return null;
  }
}

export async function checkUserPermission(
  user: LoggedInUser,
  requiredRole: Role
): Promise<boolean> {
  const roleHierarchy = {
    [Role.KEY_ADMIN]: 4,
    [Role.ADMIN]: 3,
    [Role.DOCTOR]: 2,
    [Role.PATIENT]: 1,
    [Role.USER]: 0,
  };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}
