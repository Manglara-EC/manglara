"use client";

/**
 * Componente de menú dinámico basado en roles
 * Renderiza solo los items que el usuario puede ver
 * Sin flickering, con loading states adecuados
 */

import Link from "next/link";
import { useUserRole } from "@/shared/hooks/use-user-role";
import { getMenuItemsForRole } from "@/shared/constants/menu";
import type { MenuItem } from "@/shared/constants/menu";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface RoleBasedMenuProps {
  /** Clase CSS personalizada para el contenedor */
  containerClassName?: string;
  /** Clase CSS personalizada para los items */
  itemClassName?: string;
  /** Si mostrar badges "Nuevo" */
  showBadges?: boolean;
  /** Callback cuando se hace click en un item (para analytics, cerrar menu, etc.) */
  onItemClick?: (item: MenuItem) => void;
}

/**
 * Renderiza un item de menú individual
 */
function MenuItem({
  item,
  onItemClick,
  showBadges,
  itemClassName,
}: {
  item: MenuItem;
  onItemClick?: (item: MenuItem) => void;
  showBadges?: boolean;
  itemClassName?: string;
}) {
  const Icon = item.icon;

  const content = (
    <div className="flex items-center gap-2 w-full">
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {showBadges && item.isNew && (
        <Badge variant="default" className="text-xs">
          Nuevo
        </Badge>
      )}
    </div>
  );

  // Si el item tiene submenu, no navega
  if (item.subItems && item.subItems.length > 0) {
    return (
      <div
        className={itemClassName}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onItemClick?.(item);
        }}
        onClick={() => onItemClick?.(item)}
      >
        {content}
      </div>
    );
  }

  // Si no, navega
  return (
    <Link
      href={item.href}
      className={itemClassName}
      title={item.description}
      onClick={() => onItemClick?.(item)}
    >
      {content}
    </Link>
  );
}

/**
 * Componente principal de menú basado en roles
 * Uso básico:
 * <RoleBasedMenu />
 *
 * Uso con propiedades:
 * <RoleBasedMenu
 *   containerClassName="flex flex-col gap-1"
 *   itemClassName="px-3 py-2 rounded hover:bg-gray-100"
 *   showBadges={true}
 *   onItemClick={(item) => console.log(item.id)}
 * />
 */
export function RoleBasedMenu({
  containerClassName,
  itemClassName,
  showBadges = true,
  onItemClick,
}: RoleBasedMenuProps) {
  const { role, isLoading, isError, rawRole } = useUserRole();

  // ============================================================
  // ESTADO DE CARGA
  // ============================================================
  if (isLoading) {
    return (
      <div className={containerClassName || "flex flex-col gap-2"}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    );
  }

  // ============================================================
  // ERROR O SIN AUTENTICACIÓN
  // ============================================================
  if (isError || !role) {
    return (
      <div className="text-sm text-muted-foreground p-3 text-center">
        No autenticado
      </div>
    );
  }

  // ============================================================
  // OBTENER ITEMS DE MENÚ PARA EL ROL
  // ============================================================
  const menuItems = getMenuItemsForRole(role);

  if (menuItems.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 text-center">
        Sin items de menú disponibles
      </div>
    );
  }

  // ============================================================
  // RENDERIZAR MENÚ
  // ============================================================
  return (
    <nav className={containerClassName || "flex flex-col gap-1"}>
      {menuItems.map((item) => (
        <div key={item.id}>
          {/* Item principal */}
          <MenuItem
            item={item}
            onItemClick={onItemClick}
            showBadges={showBadges}
            itemClassName={itemClassName}
          />

          {/* Subitems si existen */}
          {item.subItems && item.subItems.length > 0 && (
            <div className="ml-4 flex flex-col gap-1 mt-1 border-l border-muted pl-2">
              {item.subItems.map((subItem) => (
                <MenuItem
                  key={subItem.id}
                  item={subItem}
                  onItemClick={onItemClick}
                  showBadges={showBadges}
                  itemClassName={itemClassName}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-muted-foreground p-2 mt-4 border-t pt-2">
          <div>Role: {role}</div>
          {rawRole && <div className="text-gray-500">Raw: {rawRole}</div>}
        </div>
      )}
    </nav>
  );
}

/**
 * Componente para mostrar solo un item específico si el usuario tiene acceso
 * Útil para elementos individuales en toolbar o header
 *
 * @example
 * <ConditionalMenuItem itemId="seller-dashboard" />
 */
export function ConditionalMenuItem({
  itemId,
  className,
  onClick,
}: {
  itemId: string;
  className?: string;
  onClick?: () => void;
}) {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded" />;
  }

  // Obtenemos el item y verificamos si está permitido
  const menuItems = getMenuItemsForRole(role);
  const item = menuItems.find(
    (m) => m.id === itemId || m.subItems?.some((s) => s.id === itemId),
  );

  if (!item) return null;

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={className}
      title={item.description}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}
