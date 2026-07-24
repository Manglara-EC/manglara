import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteService } from "@/features/seller/actions/delete-service";

export const useDeleteServiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const result = await deleteService(serviceId);

      if (result.error) {
        return Promise.reject(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "services"] });

      toast.success("Servicio eliminado", {
        description: "El servicio ha sido eliminado correctamente.",
      });
    },
    onError: (error: { code: string; message: string }) => {
      toast.error("No se pudo eliminar el servicio", {
        description:
          error.message || "Por favor, inténtelo de nuevo más tarde.",
      });
    },
  });
};
