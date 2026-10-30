-- RBAC: normaliza roles globales y por comuna (idempotente).
--
-- Modelo:
--   user.role   -> 'user' | 'admin' (admin = administrador global de Manglara)
--   member.role -> 'owner' | 'admin' | 'seller' | 'member' (rol dentro de la comuna)
--
-- 1. Quien tenía el rol global heredado 'seller' conserva su capacidad de venta,
--    ahora como rol 'seller' en las comunas donde era 'member'.
UPDATE member
SET role = 'seller'
WHERE role = 'member'
  AND user_id IN (SELECT id FROM "user" WHERE role = 'seller');

-- 2. Cualquier rol global distinto de admin/user (seller, owner, NULL...) pasa a 'user'.
UPDATE "user"
SET role = 'user', updated_at = now()
WHERE role IS NULL OR role NOT IN ('user', 'admin');

-- 3. Roles compuestos heredados ("owner,member") se quedan con el de mayor privilegio.
UPDATE member
SET role = CASE
  WHEN role ~ '(^|,)\s*owner\s*(,|$)' THEN 'owner'
  WHEN role ~ '(^|,)\s*admin\s*(,|$)' THEN 'admin'
  WHEN role ~ '(^|,)\s*seller\s*(,|$)' THEN 'seller'
  ELSE 'member'
END
WHERE role LIKE '%,%';

-- 4. Roles de comuna desconocidos pasan a 'member'.
UPDATE member
SET role = 'member'
WHERE role NOT IN ('owner', 'admin', 'seller', 'member');

-- Reversión de las cuentas de prueba entregadas (solo si fuese necesario):
--   UPDATE "user" SET role = 'admin'  WHERE username = 'owner';
--   UPDATE "user" SET role = 'owner'  WHERE username = 'owner1';
--   UPDATE "user" SET role = 'seller' WHERE username = 'vendedor';
