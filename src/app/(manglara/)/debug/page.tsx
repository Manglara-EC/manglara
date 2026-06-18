"use client";

/**
 * Página de ejemplo/demo para verificar el sistema de roles
 * Ruta: /debug/role-system
 *
 * Esta página muestra cómo funciona el sistema de roles y menú
 * y ayuda a diagnosticar problemas.
 */

import { useUserRole } from "@/shared/hooks/use-user-role";
import { useSession } from "@/shared/hooks/use-session";
import { getMenuItemsForRole } from "@/shared/constants/menu";
import { canPerform, ROLE_PERMISSIONS } from "@/shared/constants/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { RoleBasedMenu } from "@/shared/components/role-based-menu";

export default function RoleSystemDebugPage() {
  const { role, isLoading: roleLoading, rawRole } = useUserRole();
  const { data: session, isLoading: sessionLoading } = useSession();

  const menuItems = role ? getMenuItemsForRole(role) : [];
  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  const isLoading = sessionLoading || roleLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🔍 Sistema de Roles - Debug</h1>
          <p className="text-gray-600">
            Verifica la detección de roles, menú y permisos
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin">⏳</div>
                <p>Cargando información de sesión y rol...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Session */}
        {!isLoading && !session && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="font-bold">❌ No hay sesión activa</p>
                <p className="text-sm text-gray-700">
                  Por favor, inicia sesión primero para ver el sistema de roles.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!isLoading && session && (
          <>
            {/* Grid de 2 columnas */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sesión */}
              <Card>
                <CardHeader>
                  <CardTitle>📱 Sesión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="font-mono font-bold">
                      {session.user?.username || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-mono text-sm">{session.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID</p>
                    <p className="font-mono text-xs text-gray-500">
                      {session.user?.id}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Rol Detectado */}
              <Card
                className={
                  role
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }
              >
                <CardHeader>
                  <CardTitle>👤 Rol Detectado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Rol (normalizado)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono font-bold text-lg">{role || "—"}</p>
                      {role && (
                        <Badge variant="default">{role.toUpperCase()}</Badge>
                      )}
                    </div>
                  </div>
                  {rawRole && rawRole !== role && (
                    <div>
                      <p className="text-sm text-gray-600">Rol (raw/original)</p>
                      <p className="font-mono text-sm text-gray-500">
                        {rawRole}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        ℹ️ Fue normalizado de "{rawRole}" a "{role}"
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Estado de carga</p>
                    <p className="font-mono text-sm">
                      {roleLoading ? "🔄 Cargando" : "✅ Listo"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items de Menú */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Items de Menú Disponibles
                  <Badge variant="secondary">{menuItems.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {menuItems.length > 0 ? (
                  <div className="space-y-3">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5" />
                          <p className="font-bold">{item.label}</p>
                          {item.isNew && (
                            <Badge variant="default" className="ml-auto">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.href}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}

                        {/* Subitems */}
                        {item.subItems && item.subItems.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2 border-t pt-2">
                            {item.subItems.map((sub) => (
                              <div
                                key={sub.id}
                                className="text-sm flex items-center gap-2"
                              >
                                <sub.icon className="h-4 w-4 text-gray-400" />
                                <span>{sub.label}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  {sub.href}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Sin items de menú disponibles para este rol
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Permisos */}
            {role && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔐 Permisos
                    <Badge variant="secondary">{permissions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                      >
                        <span className="text-green-600">✅</span>
                        <span className="text-sm font-mono">{perm}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    <p>
                      Total de permisos: <strong>{permissions.length}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prueba de Menú Basado en Roles */}
            <Card>
              <CardHeader>
                <CardTitle>🎨 Preview: RoleBasedMenu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded border">
                  <p className="text-sm text-gray-600 mb-3">
                    Así se vería el menú en la aplicación:
                  </p>
                  <div className="bg-white p-3 rounded border-l-4 border-slate-300">
                    <RoleBasedMenu
                      containerClassName="flex flex-col gap-1"
                      itemClassName="px-3 py-2 rounded hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-2"
                      showBadges={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tests */}
            <Card>
              <CardHeader>
                <CardTitle>🧪 Quick Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-bold mb-2">Ejemplo: canPerform</p>
                  <div className="space-y-1 text-sm font-mono">
                    <p>
                      canPerform("{role}", "view_products") ={" "}
                      <span
                        className={
                          canPerform(role!, "view_products")
                            ? "text-green-600 font-bold"
                            : "text-red-600 font-bold"
                        }
                      >
                        {canPerform(role!, "view_products") ? "true" : "false"}
                      </span>
                    </p>
                    <p>
                      canPerform("{role}", "create_product") ={" "}
                      <span
                        className={
                          canPerform(role!, "create_product")
                            ? "text-green-600 font-bold"
                            : "text-red-600 font-bold"
                        }
                      >
                        {canPerform(role!, "create_product") ? "true" : "false"}
                      </span>
                    </p>
                    <p>
                      canPerform("{role}", "view_sales") ={" "}
                      <span
                        className={
                          canPerform(role!, "view_sales")
                            ? "text-green-600 font-bold"
                            : "text-red-600 font-bold"
                        }
                      >
                        {canPerform(role!, "view_sales") ? "true" : "false"}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Footer */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> Si algo no se ve correctamente, revisa
                  el archivo{" "}
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                    ROLE_BASED_MENU_CHECKLIST.md
                  </code>{" "}
                  en la raíz del proyecto.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
