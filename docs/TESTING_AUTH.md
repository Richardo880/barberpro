# Testing de Autenticación - BarberPro

Guía para probar los flujos de autenticación manualmente.

## Pre-requisitos

1. La base de datos PostgreSQL debe estar ejecutándose
2. Las migraciones deben estar aplicadas:
   ```bash
   npm run db:migrate
   ```
3. El servidor debe estar ejecutándose:
   ```bash
   npm run dev
   ```

## 1. Probar Registro de Usuario Nuevo

### Caso Exitoso

1. Ve a `http://localhost:3000/registro`

2. Completa el formulario:
   - **Nombre**: Juan Pérez
   - **Email**: juan.perez@ejemplo.com
   - **Teléfono**: +595981234567 (opcional)
   - **Contraseña**: Password123
   - **Confirmar Contraseña**: Password123

3. Haz clic en "Crear Cuenta"

4. **Resultado esperado**:
   - Deberías ser redirigido a `/mi-cuenta`
   - Deberías estar autenticado automáticamente
   - Deberías ver un toast de éxito

### Verificar en la Base de Datos

```bash
npm run db:studio
```

1. Ve a la tabla `User`
2. Busca el email `juan.perez@ejemplo.com`
3. Verifica:
   - `role` debe ser `CLIENT`
   - `passwordHash` debe estar presente y hasheado
   - `createdAt` debe ser reciente

4. Ve a la tabla `ClientProfile`
5. Verifica que existe un perfil asociado al usuario

### Casos de Error a Probar

**Email duplicado**:
1. Intenta registrarte con el mismo email
2. **Esperado**: Error "El email ya está registrado"

**Contraseña débil**:
1. Intenta registrarte con contraseña: `abc123`
2. **Esperado**: Error "Debe contener al menos una mayúscula"

**Contraseñas no coinciden**:
1. Contraseña: `Password123`
2. Confirmar: `Password456`
3. **Esperado**: Error "Las contraseñas no coinciden"

**Email inválido**:
1. Email: `correo-invalido`
2. **Esperado**: Error "Email inválido"

**Teléfono inválido**:
1. Teléfono: `123` (sin código de país)
2. **Esperado**: Error de formato de teléfono

## 2. Probar Login con Credenciales

### Caso Exitoso

1. Ve a `http://localhost:3000/login`

2. Ingresa las credenciales:
   - **Email**: juan.perez@ejemplo.com
   - **Contraseña**: Password123

3. Haz clic en "Iniciar Sesión"

4. **Resultado esperado**:
   - Deberías ser redirigido a `/mi-cuenta`
   - Deberías ver tu nombre en la navbar
   - Deberías ver un toast "Bienvenido"

### Verificar Sesión

1. Abre las DevTools (F12)
2. Ve a Application > Cookies
3. Busca cookie con nombre que contenga `next-auth`
4. Debería existir y tener un valor JWT

### Casos de Error a Probar

**Email incorrecto**:
1. Email: `noexiste@ejemplo.com`
2. **Esperado**: Error "Email o contraseña incorrectos"

**Contraseña incorrecta**:
1. Email: `juan.perez@ejemplo.com`
2. Contraseña: `WrongPassword123`
3. **Esperado**: Error "Email o contraseña incorrectos"

**Campos vacíos**:
1. Deja email o contraseña vacíos
2. **Esperado**: Errores de validación en el formulario

## 3. Probar Google OAuth

### Pre-requisito: Configurar Credenciales

Si aún no lo has hecho, sigue `docs/GOOGLE_OAUTH_SETUP.md`.

### Verificar que el Botón Aparece

1. Ve a `http://localhost:3000/login`
2. Deberías ver el botón "Google" debajo del botón de "Iniciar Sesión"
3. Si no aparece, verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén en `.env.local`

### Caso Exitoso - Primer Login con Google

1. Haz clic en el botón "Google"

2. Serás redirigido a Google

3. Selecciona tu cuenta de Google (debe ser un "Test User")

4. Si aparece advertencia "Esta app no está verificada":
   - Haz clic en "Avanzado"
   - Haz clic en "Ir a BarberPro (no seguro)"

5. Autoriza los permisos solicitados

6. **Resultado esperado**:
   - Deberías ser redirigido a `/mi-cuenta`
   - Tu cuenta debería crearse automáticamente
   - Deberías estar autenticado

### Verificar Usuario OAuth en BD

```bash
npm run db:studio
```

1. Ve a la tabla `User`
2. Busca tu email de Google
3. Verifica:
   - `passwordHash` existe (aunque no puedas usarlo)
   - `role` es `CLIENT`
   - `email` es tu email de Google

4. Ve a `ClientProfile`
5. Debería existir un perfil para este usuario

### Caso Exitoso - Segundo Login con Google

1. Cierra sesión
2. Ve a `/login`
3. Haz clic en "Google"
4. Selecciona tu cuenta (no pedirá permisos de nuevo)
5. **Esperado**: Login inmediato sin crear usuario duplicado

### Casos de Error a Probar

**Usuario no es Test User**:
1. Usa una cuenta de Google que no está en Test Users
2. **Esperado**: Error "access_denied"
3. **Solución**: Agrega el email a Test Users en Google Console

**redirect_uri_mismatch**:
1. **Causa**: URL de callback no autorizada
2. **Solución**: Verifica la configuración en Google Console

**Usuario Google intenta login con password**:
1. Regístrate o loguéate con Google
2. Cierra sesión
3. Ve a `/login`
4. Intenta hacer login con email/password
5. **Esperado**: Error (usuarios de OAuth no pueden usar password)

## 4. Probar Protección de Rutas

### Rutas Protegidas

Estas rutas deberían redirigir a `/login` si no estás autenticado:

- `/mi-cuenta`
- `/mi-cuenta/reservas`
- `/mi-cuenta/nueva-reserva`
- `/mi-cuenta/perfil`
- `/admin` (requiere role ADMIN)

### Probar Protección

1. Cierra sesión (o usa modo incógnito)
2. Intenta acceder a `http://localhost:3000/mi-cuenta`
3. **Esperado**: Redirección a `/login?callbackUrl=/mi-cuenta`
4. Inicia sesión
5. **Esperado**: Redirección de vuelta a `/mi-cuenta`

### Probar Rutas de Admin

1. Inicia sesión como CLIENT (usuario normal)
2. Intenta acceder a `http://localhost:3000/admin`
3. **Esperado**: Redirección o mensaje de error
4. Solo usuarios con `role: ADMIN` pueden acceder

## 5. Probar Cierre de Sesión

1. Estando autenticado, haz clic en tu nombre en la navbar
2. Haz clic en "Cerrar Sesión"
3. **Esperado**:
   - Redirección a `/`
   - Ya no deberías ver tu nombre en la navbar
   - La cookie de sesión debería eliminarse

## 6. Tests Automatizados

### Ejecutar Tests de Registro

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev

# En otra terminal
npm test -- register.integration.test.ts
```

### Tests Incluidos

- ✅ Registro exitoso
- ✅ Email duplicado
- ✅ Contraseña débil
- ✅ Contraseñas no coinciden
- ✅ Email inválido
- ✅ Registro sin teléfono
- ✅ Teléfono inválido
- ✅ Password hasheado correctamente

## 7. Verificar Logs

### Logs del Servidor

Mientras pruebas, mantén la consola del servidor abierta:

```bash
npm run dev
```

Deberías ver:
- `Auth error:` si hay errores de autenticación
- `Error en registro:` si hay errores en el registro
- Mensajes de Prisma si hay problemas de BD

### Logs del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Los errores de red aparecerán aquí
4. Los toast notifications también se muestran aquí

## 8. Limpiar Datos de Prueba

Si quieres eliminar los usuarios de prueba:

```bash
npm run db:studio
```

1. Ve a la tabla `ClientProfile`
2. Elimina los perfiles de prueba
3. Ve a la tabla `User`
4. Elimina los usuarios de prueba

O usando SQL:

```bash
psql -U barberpro -d barberpro
```

```sql
-- Ver usuarios de prueba
SELECT id, name, email, role FROM users;

-- Eliminar un usuario específico (cascada eliminará su ClientProfile)
DELETE FROM users WHERE email = 'juan.perez@ejemplo.com';

-- Salir
\q
```

## 9. Checklist de Testing Completo

Antes de considerar que el auth está funcionando completamente:

- [ ] Registro con datos válidos funciona
- [ ] Registro con email duplicado falla correctamente
- [ ] Validación de contraseña funciona
- [ ] Login con credenciales válidas funciona
- [ ] Login con credenciales inválidas falla
- [ ] Botón de Google aparece (si está configurado)
- [ ] Login con Google crea usuario nuevo
- [ ] Segundo login con Google no crea duplicado
- [ ] Usuarios de Google no pueden usar password
- [ ] Rutas protegidas redirigen a login
- [ ] Cierre de sesión funciona
- [ ] Las sesiones persisten al recargar la página
- [ ] Tests automatizados pasan

## Problemas Comunes

Si algo no funciona, consulta:
- `docs/TROUBLESHOOTING_AUTH.md`
- Los logs del servidor
- Los logs del navegador
- La configuración de `.env.local`
- El estado de PostgreSQL

## Crear Usuario Admin para Testing

Si necesitas un usuario ADMIN:

```bash
npm run db:studio
```

1. Ve a la tabla `User`
2. Encuentra o crea un usuario
3. Cambia el campo `role` a `ADMIN`
4. Guarda

O usando SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@ejemplo.com';
```

Ahora ese usuario puede acceder a `/admin`.
