// Helper interno de servidor: solo se invoca desde server actions que ya
// validan permisos. No lleva "use server" para no exponerlo al cliente.

import { sql } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { deleteImage } from "@/shared/constants";

/**
 * Borra del almacenamiento las imágenes que un ítem dejó de usar al editarlo.
 *
 * Solo toca URLs del bucket propio y nunca una que otro producto o servicio
 * siga referenciando: así nadie puede borrar imágenes ajenas copiando su URL
 * en su ítem y quitándola después. Nunca hace fallar la edición.
 */
export async function deleteReplacedImages({
  itemId,
  previous,
  next,
}: {
  itemId: string;
  previous: string[] | null | undefined;
  next: string[] | null | undefined;
}) {
  const prefix = `${process.env.R2_PUBLIC_URL}/`;
  const kept = new Set(next ?? []);
  const removed = (previous ?? []).filter(
    (url) => !kept.has(url) && url.startsWith(prefix),
  );

  await Promise.allSettled(
    removed.map(async (url) => {
      const { rows } = await db.execute(sql`
        select 1 from product where id <> ${itemId} and images::jsonb ? ${url}
        union all
        select 1 from service where id <> ${itemId} and images::jsonb ? ${url}
        limit 1
      `);

      if (rows.length === 0) await deleteImage(url.slice(prefix.length));
    }),
  );
}
