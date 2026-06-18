"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createProduct } from "@/features/seller/actions/create-product";
import type { CreateProductVariables } from "@/features/seller/types";

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CreateProductVariables) => {
      const result = await createProduct(variables);

      if (result.error) {
        return Promise.reject(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["my-combined-items"] });
      queryClient.invalidateQueries({ queryKey: ["organization", data?.organizationId, "items"] });
      
      toast.success("Producto creado exitosamente 🎉", {
        description: "Tu producto está pendiente de aprobación.",
      });

      // Redirigir a la lista de productos del seller
      router.push("/seller/products");
    },
    onError: (error: { code: string; message: string }) => {
      toast.error("No se pudo crear el producto 😢", {
        description: error.message || "Por favor, inténtelo de nuevo más tarde.",
      });
    },
  });
};
