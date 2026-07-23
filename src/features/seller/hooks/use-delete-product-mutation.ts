"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteProduct } from "@/features/seller/actions/delete-product";

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await deleteProduct(productId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Producto eliminado correctamente");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-combined-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el producto");
    },
  });
};
