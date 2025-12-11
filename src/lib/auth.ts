import "server-only";

import prisma from "@/lib/prisma";
import { Role, type LoggedInUser } from "@/types";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET);

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

// Token payload types
export interface AccessTokenPayload {
  loggedInUser: LoggedInUser;
}

export interface RefreshTokenPayload {
  jti: string; // token id for rotation tracking
  userId: string;
}

// Generate access token (short lived)
export async function generateAccessToken(
  loggedInUser: LoggedInUser,
  expiresIn: string | number = "15m"
): Promise<string> {
  const token = await new SignJWT({ loggedInUser })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(ACCESS_TOKEN_SECRET);

  return token;
}

// Generate refresh token (long lived) and persist in DB
export async function generateRefreshToken(
  userId: string,
  options: { expiresIn?: string | number; ip?: string; userAgent?: string } = {}
): Promise<string> {
  // create a jti
  const jti = crypto.randomUUID();
  const expiresIn = options.expiresIn ?? "30d";

  const token = await new SignJWT({ jti, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(REFRESH_TOKEN_SECRET);

  // Persist refresh token metadata in DB
  const now = new Date();
  const expiresAt = new Date(now);
  // Normalize expiresIn when it's string like '30d' to milliseconds - simple handling for days/hours/minutes
  if (typeof expiresIn === "string" && expiresIn.endsWith("d")) {
    const days = Number.parseInt(expiresIn.slice(0, -1), 10) || 30;
    expiresAt.setDate(expiresAt.getDate() + days);
  } else if (typeof expiresIn === "number") {
    // assume seconds
    expiresAt.setTime(expiresAt.getTime() + expiresIn * 1000);
  } else {
    // fallback 30 days
    expiresAt.setDate(expiresAt.getDate() + 30);
  }

  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      ip: options.ip,
      userAgent: options.userAgent,
      expiresAt,
    },
  });

  return token;
}

// Verify access token
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<AccessTokenPayload>(
      token,
      ACCESS_TOKEN_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    return payload;
  } catch (error) {
    console.error("ACCESS TOKEN VERIFICATION FAILED:", error);
    return null;
  }
}

// Verify refresh token and ensure it exists + not revoked
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<RefreshTokenPayload>(
      token,
      REFRESH_TOKEN_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const jti = payload.jti;
    const userId = payload.userId;
    if (!jti || !userId) return null;

    // look up in DB
    const record = await prisma.refreshToken.findUnique({ where: { jti } });
    if (!record) return null;
    if (record.revoked) return null;
    if (record.expiresAt < new Date()) return null;

    return { jti, userId };
  } catch (error) {
    console.error("REFRESH TOKEN VERIFICATION FAILED:", error);
    return null;
  }
}

// Revoke a refresh token record
export async function revokeRefreshToken(jti: string): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: { jti },
      data: { revoked: true },
    });
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
  }
}

export async function revokeAllUserRefreshTokens(
  userId: string
): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  } catch (error) {
    console.error("Failed to revoke all refresh tokens for user:", error);
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
  } as Record<Role, number>;
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export function mapDbUserToLoggedInUser(found: unknown): LoggedInUser | null {
  if (!found || typeof found !== "object") return null;
  const f = found as Record<string, unknown>;

  const id = typeof f.id === "string" ? f.id : null;
  if (!id) return null;

  let name = "";
  if (typeof f.name === "string") {
    name = f.name;
  } else if (typeof f.ownerName === "string") {
    name = f.ownerName;
  }

  let email = "";
  if (typeof f.email === "string") {
    email = f.email;
  } else if (typeof f.username === "string") {
    email = f.username;
  }

  const avatar = typeof f.avatar === "string" ? f.avatar : undefined;

  const roleVal = f.role;
  const role: Role =
    typeof roleVal === "string" &&
    (Object.values(Role) as string[]).includes(roleVal)
      ? (roleVal as Role)
      : Role.USER;

  return { id, name, email, avatar, role };
}
