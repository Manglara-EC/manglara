import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useHotkeys } from "react-hotkeys-hook";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { authClient } from "@/shared/lib/better-auth/client";

export const useNavUser = () => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(
    async (event?: Event) => {
      event?.preventDefault();

      if (isSigningOut) return;

      setIsSigningOut(true);

      const { error } = await authClient.signOut();

      if (error) {
        setIsSigningOut(false);
        toast.error("Failed to sign out. Please try again later.");
        return;
      }

      router.push("/sign-in");
    },
    [isSigningOut, router],
  );

  const handleThemeChange = useCallback(
    (event?: Event) => {
      event?.preventDefault();

      if (theme === "dark") {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    },
    [setTheme, theme],
  );

  useHotkeys("ctrl+shift+t", handleThemeChange);
  useHotkeys("ctrl+o", handleSignOut);

  return {
    isMobile,
    isSigningOut,
    handleSignOut,
    handleThemeChange,
    theme,
  };
};
