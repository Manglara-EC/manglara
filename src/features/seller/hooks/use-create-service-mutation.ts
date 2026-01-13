import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createService } from "@/features/seller/actions/create-service";
import type { CreateServiceVariables } from "@/features/seller/types";

export const useCreateServiceMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CreateServiceVariables) => {
      const result = await createService(variables);

      if (result.error) {
        return Promise.reject(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "services"] });
      queryClient.invalidateQueries({ queryKey: ["organization", data?.organizationId, "items"] });
      
      toast.success("Servicio creado exitosamente 🎉", {
        description: "Tu servicio está pendiente de aprobación.",
      });

      // Redirigir a la lista de servicios del seller
      router.push("/seller/services");
    },
    onError: (error: { code: string; message: string }) => {
      toast.error("No se pudo crear el servicio 😢", {
        description: error.message || "Por favor, inténtelo de nuevo más tarde.",
      });
    },
  });
};
