"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateProduct } from "@/features/seller/actions/update-product";
import type {
  UpdateProductVariables,
  ProductWithOrg,
} from "@/features/seller/types";

interface UseUpdateProductMutationOptions {
  productId: string;
  onSuccess?: (data: ProductWithOrg) => void;
  onError?: (error: Error) => void;
}

export const useUpdateProductMutation = ({
  productId,
  onSuccess,
  onError,
}: UseUpdateProductMutationOptions) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductVariables) => {
      const result = await updateProduct(productId, data);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data!;
    },
    onSuccess: (data) => {
      toast.success("Producto actualizado correctamente", {
        description: "Tu producto está pendiente de aprobación nuevamente.",
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["seller", "product", productId],
      });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-combined-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      onSuccess?.(data);
      router.push("/seller/products");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el producto");
      onError?.(error);
    },
  });
};
