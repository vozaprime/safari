import { prisma } from "./db";

export async function logAudit(
  userEmail: string,
  action: string,
  entity: string,
  detail = ""
) {
  try {
    await prisma.auditLog.create({ data: { userEmail, action, entity, detail } });
  } catch {
    /* audit logging must never break the main action */
  }
}
