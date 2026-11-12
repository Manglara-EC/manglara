import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

// La revisión de ítems vive en /review (la usan el admin global y los
// administradores de comuna). Se conserva esta ruta por enlaces antiguos.
export default async function LegacyAdminItemPage({ params }: Props) {
  const { type, id } = await params;

  redirect(`/review/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
}
