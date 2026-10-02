import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Role definitions (Masud + Rahul).
 *
 * Three product roles: FARMER, EXPERT, ADMIN.
 *
 * Note for the team: the admin plugin stores roles as a comma-separated *string*
 * (`"farmer"`, `"admin"`), not a Prisma enum. So the auth-side role is always a
 * string; the `UserRole` enum we define for domain models is a separate concern.
 *
 * Kept deliberately small — permissions here gate auth-specific actions only.
 * Row-level ownership ("a farmer may only edit their own farms") is enforced in
 * the route middleware, not here.
 */

export const statement = {
  ...defaultStatements,
  ai: ["use"],
  question: ["create", "answer"],
} as const;

export const ac = createAccessControl(statement);

export const farmer = ac.newRole({
  ai: ["use"],
  question: ["create"],
});

export const expert = ac.newRole({
  question: ["answer"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  ai: ["use"],
  question: ["create", "answer"],
});