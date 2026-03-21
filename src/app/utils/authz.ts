import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import { errorResponse } from "@/app/utils/api";

export type Role =
  | "SuperAdmin"
  | "Admin"
  | "clientAdmin"
  | "Doctor"
  | "Receptionist"
  | "Patient";

const elevatedRoles: Role[] = ["SuperAdmin", "Admin", "clientAdmin"];

type AuthOk = { user: { id: string; role: Role } };
type AuthErr = { error: NextResponse };

export async function requireAuth(
  allowedRoles?: Role[]
): Promise<AuthOk | AuthErr> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.role) {
    return {
      error: errorResponse(401, "Unauthorized"),
    };
  }

  const role = user.role as Role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      error: errorResponse(403, "Forbidden"),
    };
  }

  return { user: { id: user.id as string, role } };
}

export function isElevatedRole(role: Role): boolean {
  return elevatedRoles.includes(role);
}

export function resolveUserIdFromHeader(
  request: Request,
  user: { id: string; role: Role },
  headerName: string,
  options?: { allowAdmin?: boolean }
): { userId: string } | AuthErr {
  const headerValue = request.headers.get(headerName);
  if (!headerValue) {
    return {
      error: errorResponse(400, `${headerName} is required in headers`),
    };
  }

  if (headerValue !== user.id) {
    const allowAdmin = options?.allowAdmin ?? true;
    const isElevated = allowAdmin && elevatedRoles.includes(user.role);
    if (!isElevated) {
      return {
        error: errorResponse(403, "Forbidden"),
      };
    }
  }

  return { userId: headerValue };
}
