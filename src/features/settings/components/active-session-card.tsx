import { MinusCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { useActiveSessionCard } from "@/features/settings/hooks/use-active-session-card";
import type { Session } from "@/shared/types";

interface Props {
  session: Omit<Session["session"], "id">;
  isCurrentSession: boolean;
  isSessionsFetching: boolean;
}

export const ActiveSessionCard = ({
  session,
  isCurrentSession,
  isSessionsFetching,
}: Props) => {
  const { t: tSettings } = useTranslation("settings");

  const { handleRevokeSession } = useActiveSessionCard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {tSettings("activeSessionCard.fields.userAgent")}{" "}
          {isCurrentSession && (
            <Badge>{tSettings("activeSessionCard.text.current")}</Badge>
          )}
        </CardTitle>

        <CardDescription>{session.userAgent}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-0 text-sm">
        <div className="flex items-center gap-2">
          <TypographyP>
            {tSettings("activeSessionCard.fields.ipAddress")}:
          </TypographyP>
          <TypographyMuted>{session.ipAddress}</TypographyMuted>
        </div>

        <div className="flex items-center gap-2">
          <TypographyP>
            {tSettings("activeSessionCard.fields.createdAt")}:
          </TypographyP>
          <TypographyMuted>
            {new Date(session.createdAt).toLocaleString()}
          </TypographyMuted>
        </div>

        <div className="flex items-center gap-2">
          <TypographyP>
            {tSettings("activeSessionCard.fields.updatedAt")}:
          </TypographyP>
          <TypographyMuted>
            {new Date(session.updatedAt).toLocaleString()}
          </TypographyMuted>
        </div>

        <div className="flex items-center gap-2">
          <TypographyP>
            {tSettings("activeSessionCard.fields.expiresAt")}:
          </TypographyP>
          <TypographyMuted>
            {new Date(session.expiresAt).toLocaleString()}
          </TypographyMuted>
        </div>
      </CardContent>

      {!isCurrentSession && !isSessionsFetching && (
        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            type="button"
            onClick={() => handleRevokeSession(session.token)}
          >
            <MinusCircleIcon />
            {tSettings("activeSessionCard.actions.revoke")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
