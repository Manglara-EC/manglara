/**
 * Control de acceso de better-auth para los roles de comuna.
 * Se comparte entre el servidor y el cliente (inferencia de roles).
 *
 * Ningún rol de comuna puede eliminar la comuna: eso queda reservado al
 * administrador global, que lo hace desde una server action.
 */

import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const organizationAc = createAccessControl(defaultStatements);

const managerStatements = {
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const organizationRoles = {
  owner: organizationAc.newRole(managerStatements),
  admin: organizationAc.newRole(managerStatements),
  seller: organizationAc.newRole({}),
  member: organizationAc.newRole({}),
};
