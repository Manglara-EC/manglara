import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  BarChart3Icon,
  BoxIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manglara | Dashboard del Vendedor",
};

export default function SellerDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1>Dashboard</TypographyH1>
        <TypographyMuted>
          Bienvenido a tu panel de vendedor. Aquí podrás gestionar tus productos
          y servicios.
        </TypographyMuted>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <BoxIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Productos publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <ShoppingBagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Servicios publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Ventas este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Visitas a tus publicaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para más contenido */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No hay actividad reciente. ¡Empieza creando tu primer producto o
            servicio!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
