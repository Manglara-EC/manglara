import { z } from "zod";

import { updateNameSchema } from "@/features/settings/schemas/update-name";
import { updateUsernameSchema } from "@/features/settings/schemas/update-username";
import { updateEmailSchema } from "@/features/settings/schemas/update-email";

import { updatePasswordSchema } from "@/features/settings/schemas/update-password";
import { updateTwoFactorSchema } from "@/features/settings/schemas/update-two-factor";
import { generateBackupCodesSchema } from "@/features/settings/schemas/generate-backup-codes";

export type UpdateNameVariables = z.infer<typeof updateNameSchema>;
export type UpdateUsernameVariables = z.infer<typeof updateUsernameSchema>;
export type UpdateEmailVariables = z.infer<typeof updateEmailSchema>;

export type UpdatePasswordVariables = z.infer<typeof updatePasswordSchema>;
export type UpdateTwoFactorVariables = z.infer<typeof updateTwoFactorSchema>;
export type GenerateBackupCodesVariables = z.infer<
  typeof generateBackupCodesSchema
>;
