import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  magicLinkClient,
  twoFactorClient,
  inferAdditionalFields,
  adminClient,
  organizationClient,
} from "better-auth/client/plugins";
import { toast } from "sonner";

import type { auth } from "@/shared/lib/better-auth/server";
import {
  organizationAc,
  organizationRoles,
} from "@/shared/lib/better-auth/organization-access";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    magicLinkClient(),
    twoFactorClient(),
    inferAdditionalFields<typeof auth>(),
    adminClient(),
    organizationClient({
      ac: organizationAc,
      roles: organizationRoles,
    }),
  ],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;

      if (response.status === 429) {
        toast.error("Rate limit exceeded 🚫", {
          duration: 10_000,
          description: "Try again later, take a break!",
        });
      }
    },
  },
});
