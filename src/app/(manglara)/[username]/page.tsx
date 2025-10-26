import { notFound } from "next/navigation";

import { getUser } from "@/shared/actions/get-user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { error } = await getUser({ username });

  if (error) {
    if (error.message === "User not found")
      return {
        title: "Manglara | Página no encontrada",
        description: "Página no encontrada",
      };
  }

  return {
    title: `Manglara | Perfil (@${username})`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data, error } = await getUser({ username });

  if (error) {
    if (error.message === "User not found") return notFound();

    throw new Error("Algo salió mal mientras se obtenía los datos del perfil");
  }

  return (
    <main className="flex flex-col items-center gap-6">
      <Avatar className="size-42 sm:size-52">
        <AvatarImage src={data?.image ?? undefined} />
        <AvatarFallback className="text-6xl">
          {data?.name
            ?.split(" ")
            .map((name) => name.charAt(0))
            .join("")}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center gap-1">
        <TypographyH1 className="text-center">{data?.name}</TypographyH1>
        <TypographyMuted className="text-center">
          @{data?.username}
        </TypographyMuted>
      </div>
    </main>
  );
}
