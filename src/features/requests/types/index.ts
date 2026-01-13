import type { Request } from "@/shared/types";

export interface MarkAsReadVariables {
  requestId: string;
}

export interface RequestWithReference extends Request {
  productName: string | null;
  serviceName: string | null;
}