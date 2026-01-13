"use client";

/**
 * ROLE_SYSTEM_EXAMPLES.tsx
 * 
 * Ejemplos prácticos de cómo usar el sistema de roles
 * Copiar y adaptar según necesidad
 */

// ============================================================
// EJEMPLO 1: Usar el hook useUserRole en un componente
// ============================================================

import { useUserRole } from "@/shared/hooks/use-user-role";

export function Example1_DetectUserRole() {
  const { role, isLoading, isError } = useUserRole();

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al obtener rol</div>;
  if (!role) return <div>No autenticado</div>;

  return (
    <div>
      <p>Tu rol es: {role}</p>
      {role === "seller" && <p>Eres vendedor, ¡puedes vender!</p>}
      {role === "admin" && <p>Eres admin, tienes acceso total</p>}
      {role === "user" && <p>Eres usuario regular</p>}
    </div>
  );
}

// ============================================================
// EJEMPLO 2: Renderizar menú basado en roles
// ============================================================

import { RoleBasedMenu } from "@/shared/components/role-based-menu";

export function Example2_RenderMenu() {
  return (
    <aside className="w-64 bg-slate-900 text-white p-4">
      <h1 className="mb-6 text-2xl font-bold">Menú</h1>
      <RoleBasedMenu
        containerClassName="space-y-2"
        itemClassName="block px-4 py-2 rounded hover:bg-slate-700 transition-colors"
        showBadges={true}
        onItemClick={(item) => {
          console.log("Usuario hizo click en:", item.id);
        }}
      />
    </aside>
  );
}

// ============================================================
// EJEMPLO 3: Condicionales por rol
// ============================================================

import { useHasRole, useHasAnyRole } from "@/shared/hooks/use-user-role";

export function Example3_ConditionalsByRole() {
  const isSeller = useHasRole("seller");
  const isAdminOrSeller = useHasAnyRole(["admin", "seller"]);

  return (
    <div className="space-y-4">
      {/* Solo vendedores ven esto */}
      {isSeller && (
        <div className="p-4 bg-blue-100 rounded">
          <p>Panel de vendedor</p>
          <button>Crear Producto</button>
        </div>
      )}

      {/* Admins y vendedores ven esto */}
      {isAdminOrSeller && (
        <div className="p-4 bg-green-100 rounded">
          <p>Panel de gestión</p>
          <button>Ver Analytics</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EJEMPLO 4: Verificar permisos específicos
// ============================================================

import { canPerform } from "@/shared/constants/roles";

export function Example4_CheckPermissions() {
  const { role } = useUserRole();

  if (!role) return null;

  const canCreateProduct = canPerform(role, "create_product");
  const canViewSales = canPerform(role, "view_sales");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span>Crear Producto:</span>
        <span className={canCreateProduct ? "text-green-600" : "text-red-600"}>
          {canCreateProduct ? "✅ Permitido" : "❌ Prohibido"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>Ver Ventas:</span>
        <span className={canViewSales ? "text-green-600" : "text-red-600"}>
          {canViewSales ? "✅ Permitido" : "❌ Prohibido"}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// EJEMPLO 5: Obtener items de menú para el rol actual
// ============================================================

import { getMenuItemsForRole } from "@/shared/constants/menu";

export function Example5_GetMenuItems() {
  const { role, isLoading } = useUserRole();

  if (isLoading) return <div>Cargando menú...</div>;
  if (!role) return null;

  const menuItems = getMenuItemsForRole(role);

  return (
    <div>
      <h2>Items de menú disponibles ({menuItems.length}):</h2>
      <ul className="list-disc ml-6">
        {menuItems.map((item) => (
          <li key={item.id}>
            {item.label} → {item.href}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// EJEMPLO 6: Proteger ruta (componente wrapper)
// ============================================================

interface ProtectedRouteProps {
  requiredRole: "user" | "seller" | "admin";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Example6_ProtectedRoute({
  requiredRole,
  children,
  fallback,
}: ProtectedRouteProps) {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <div>Verificando permisos...</div>;
  }

  // Los admins pueden acceder a todo
  const isAllowed = role === "admin" || role === requiredRole;

  if (!isAllowed) {
    return fallback || <div>No tienes permisos para acceder aquí</div>;
  }

  return <>{children}</>;
}

// Uso:
export function Example6_Usage() {
  return (
    <Example6_ProtectedRoute requiredRole="seller" fallback={<p>Solo vendedores</p>}>
      <div>Contenido solo para vendedores</div>
    </Example6_ProtectedRoute>
  );
}

// ============================================================
// EJEMPLO 7: Server action con verificación de permisos
// ============================================================

import { canPerform } from "@/shared/constants/roles";

// En src/features/products/actions/create-product.ts
export async function createProductAction(
  data: { name: string; price: number },
  userRole: string // Debe venir de la sesión del servidor
) {
  // Verificar permiso ANTES de ejecutar
  if (!canPerform(userRole as any, "create_product")) {
    return {
      error: "No tienes permiso para crear productos",
      data: null,
    };
  }

  // Ejecutar lógica de negocio
  // const product = await db.product.create({ ... });

  return {
    error: null,
    data: { id: "new-id", ...data },
  };
}

// ============================================================
// EJEMPLO 8: Componente que muestra info de debug
// ============================================================

export function Example8_DebugInfo() {
  const { role, isLoading, rawRole } = useUserRole();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded font-mono text-sm">
      <div>role (normalizado): <strong>{role}</strong></div>
      {rawRole && <div>role (raw): <strong>{rawRole}</strong></div>}
      <div>isLoading: <strong>{isLoading ? "true" : "false"}</strong></div>
    </div>
  );
}

// ============================================================
// EJEMPLO 9: Dropdown de selección de rol (para testing)
// ============================================================

export function Example9_RoleSelector() {
  const [selectedRole, setSelectedRole] = useUserRole();

  // Nota: En producción NO hacer esto, solo para desarrollo/testing
  // Este es un pseudo-código

  return (
    <select
      value={selectedRole || ""}
      onChange={(e) => {
        // En real, esto actualizaría la BD
        console.log("En producción, esto debe cambiar la BD");
      }}
    >
      <option value="user">Usuario</option>
      <option value="seller">Vendedor</option>
      <option value="admin">Admin</option>
    </select>
  );
}

// ============================================================
// EJEMPLO 10: Breadcrumb con roles
// ============================================================

export function Example10_RoleBreadcrumb() {
  const { role } = useUserRole();

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    role === "seller" && { label: "Dashboard Vendedor", href: "/seller/dashboard" },
    role === "admin" && { label: "Admin Panel", href: "/admin" },
  ].filter(Boolean);

  return (
    <nav className="flex gap-2">
      {breadcrumbItems.map((item: any, index) => (
        <div key={item.href} className="flex items-center gap-2">
          <a href={item.href} className="text-blue-600 hover:underline">
            {item.label}
          </a>
          {index < breadcrumbItems.length - 1 && <span>/</span>}
        </div>
      ))}
    </nav>
  );
}

// ============================================================
// EJEMPLO 11: Componente Layout que cambia por rol
// ============================================================

export function Example11_DynamicLayout() {
  const { role, isLoading } = useUserRole();

  if (isLoading) return <div>Cargando layout...</div>;

  if (role === "seller") {
    return (
      <div className="grid grid-cols-4 gap-4">
        <aside className="col-span-1 bg-slate-100 p-4">
          <RoleBasedMenu />
        </aside>
        <main className="col-span-3 p-4">
          {/* Contenido de vendedor */}
        </main>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="grid grid-cols-5 gap-4">
        <aside className="col-span-1 bg-red-100 p-4">
          <RoleBasedMenu />
        </aside>
        <main className="col-span-4 p-4">
          {/* Contenido de admin */}
        </main>
      </div>
    );
  }

  // Default para usuarios regulares
  return (
    <div>
      <nav className="bg-white shadow p-4">
        <RoleBasedMenu containerClassName="flex gap-4" />
      </nav>
      <main className="p-4">{/* Contenido de usuario */}</main>
    </div>
  );
}

// ============================================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================================

/**
 * PUNTOS CLAVE:
 * 
 * 1. useUserRole() SIEMPRE se usa en componentes "use client"
 * 2. El rol viene de la sesión de better-auth (no del cliente)
 * 3. isLoading es true hasta que la sesión esté lista
 * 4. Nunca confíes en el rol en el servidor (verifica siempre)
 * 5. Para server actions, pasa el rol como parámetro
 * 
 * TESTING:
 * 
 * 1. Navega a /debug para ver estadísticas en vivo
 * 2. Abre DevTools → Console para ver logs
 * 3. Prueba con múltiples usuarios para ver cambios
 * 4. Recarga (F5) para verificar que no hay flickering
 * 
 * DEBUGGING:
 * 
 * 1. Si no ves menú: Verifica que role !== null
 * 2. Si parpadea: Verifica isLoading state
 * 3. Si rol está en mayúsculas: Usa normalizeRole()
 * 4. Si items faltan: Verifica menu.ts allowedRoles
 * 
 * PERFORMANCE:
 * 
 * 1. useUserRole() cachea el rol automáticamente
 * 2. No hace muchas llamadas al servidor
 * 3. SSR safe (no causa mismatch)
 * 4. Renderiza en < 100ms normalmente
 */
