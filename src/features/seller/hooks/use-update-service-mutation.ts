"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateService } from "@/features/seller/actions/update-service";
import type { UpdateServiceVariables, ServiceWithOrg } from "@/features/seller/types";

interface UseUpdateServiceMutationOptions {
  serviceId: string;
  onSuccess?: (data: ServiceWithOrg) => void;
  onError?: (error: Error) => void;
}

export const useUpdateServiceMutation = ({
  serviceId,
  onSuccess,
  onError,
}: UseUpdateServiceMutationOptions) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateServiceVariables) => {
      const result = await updateService(serviceId, data);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data!;
    },
    onSuccess: (data) => {
      toast.success("Servicio actualizado correctamente");
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "services"] });
      queryClient.invalidateQueries({ queryKey: ["seller", "service", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      
      onSuccess?.(data);
      router.push("/seller/services");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el servicio");
      onError?.(error);
    },
  });
};
