# Troubleshooting - Autenticación y Registro

Esta guía cubre problemas comunes con la autenticación y registro en BarberPro.

## Problemas de Registro

### Error: "El email ya está registrado"

**Causa**: Ya existe una cuenta con ese email.

**Soluciones**:
1. Usa otro email
2. Si olvidaste tu contraseña, usa la opción de recuperación (próximamente)
3. Si te registraste con Google, inicia sesión con Google

### Error: "Datos inválidos" o errores de validación

**Causa**: Los datos del formulario no cumplen los requisitos.

**Requisitos del formulario**:

**Nombre**:
- Mínimo 2 caracteres
- Máximo 100 caracteres

**Email**:
- Debe ser un email válido (ej: usuario@dominio.com)

**Teléfono** (opcional):
- Debe incluir código de país con `+` (ej: +595981234567)
- Formato E.164
- Si no quieres proporcionar teléfono, deja el campo vacío

**Contraseña**:
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 número
- Ejemplos válidos: `Password123`, `MiClave2024`

**Confirmar Contraseña**:
- Debe coincidir exactamente con la contraseña

### Error: "No se pudo conectar a la base de datos"

**Causa**: El servidor no puede conectarse a PostgreSQL.

**Soluciones**:

1. Verifica que PostgreSQL esté ejecutándose:
   ```bash
   # En Linux/Mac
   sudo systemctl status postgresql

   # Con Docker
   docker ps | grep postgres
   ```

2. Verifica las credenciales en `.env.local`:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/barberpro"
   ```

3. Verifica que la base de datos exista:
   ```bash
   psql -U usuario -d barberpro -c "SELECT 1"
   ```

4. Ejecuta las migraciones si es necesario:
   ```bash
   npm run db:migrate
   ```

### Error: "Error al crear la cuenta"

**Causa**: Error genérico durante la creación de la cuenta.

**Soluciones**:

1. Revisa los logs del servidor para más detalles
2. Verifica que todas las migraciones de Prisma estén aplicadas:
   ```bash
   npm run db:migrate
   ```
3. Intenta nuevamente después de unos segundos
4. Si el problema persiste, verifica los logs de PostgreSQL

## Problemas de Login

### Error: "Email o contraseña incorrectos"

**Causas posibles**:
1. Email incorrecto
2. Contraseña incorrecta
3. La cuenta se creó con Google OAuth

**Soluciones**:
- Verifica que el email sea correcto
- Verifica que la contraseña sea correcta
- Si te registraste con Google, debes usar el botón de Google para iniciar sesión

### No puedo hacer login después de registrarme con Google

**Causa**: Los usuarios de Google no pueden hacer login con email/password.

**Solución**:
- Siempre usa el botón de Google para iniciar sesión
- Si necesitas una cuenta con contraseña, regístrate con un email diferente usando el formulario

### Error: "User registered with OAuth, cannot login with credentials"

**Causa**: Intentas hacer login con email/password pero tu cuenta fue creada con Google.

**Solución**:
- Usa el botón de Google para iniciar sesión
- Este es un comportamiento de seguridad intencional

## Problemas de Google OAuth

### El botón de Google no aparece

**Causa**: Las credenciales de Google OAuth no están configuradas.

**Solución**:

1. Verifica que existan las variables en `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-client-secret"
   ```

2. Si están vacías, sigue la guía en `docs/GOOGLE_OAUTH_SETUP.md`

3. Reinicia el servidor después de agregar las credenciales:
   ```bash
   npm run dev
   ```

### Error: "redirect_uri_mismatch"

**Causa**: La URL de callback no está autorizada en Google Cloud Console.

**Solución**:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a **APIs & Services** > **Credentials**
3. Selecciona tu OAuth 2.0 Client ID
4. En **Authorized redirect URIs**, agrega:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Guarda los cambios
6. Espera unos minutos y vuelve a intentar

### Error: "access_denied" o "This app isn't verified"

**Causa**: La aplicación está en modo Testing en Google Cloud Console.

**Solución**:

**Para desarrollo**:
1. Agrega tu email como "Test user" en OAuth consent screen
2. Cuando aparezca la advertencia, haz clic en "Avanzado"
3. Haz clic en "Ir a BarberPro (no seguro)"

**Para producción**:
1. Publica la aplicación en Google Cloud Console
2. Completa el proceso de verificación

### Google OAuth funciona en desarrollo pero no en producción

**Causa**: Las URLs autorizadas no incluyen el dominio de producción.

**Solución**:

1. En Google Cloud Console, agrega tu dominio de producción:
   ```
   https://tu-dominio.com/api/auth/callback/google
   ```

2. Verifica las variables de entorno en producción:
   ```env
   NEXTAUTH_URL="https://tu-dominio.com"
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   NEXTAUTH_SECRET="..."
   ```

## Problemas de Sesión

### La sesión expira muy rápido

**Causa**: Configuración de sesión en NextAuth.

**Solución**:
- Por defecto, las sesiones duran 30 días
- Si quieres cambiar esto, edita `src/lib/auth.ts`:
  ```typescript
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
  }
  ```

### No puedo cerrar sesión

**Causa**: Error en el proceso de sign out.

**Solución**:
1. Limpia las cookies del navegador manualmente
2. Cierra y vuelve a abrir el navegador
3. Intenta en modo incógnito

## Base de Datos

### Error: "Database barberpro does not exist"

**Causa**: La base de datos no ha sido creada.

**Solución**:

1. Conecta a PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Crea la base de datos:
   ```sql
   CREATE DATABASE barberpro;
   ```

3. Sal de psql:
   ```
   \q
   ```

4. Ejecuta las migraciones:
   ```bash
   npm run db:migrate
   ```

### Error: "Relation 'users' does not exist"

**Causa**: Las migraciones de Prisma no han sido ejecutadas.

**Solución**:

```bash
# Genera el cliente de Prisma
npm run db:generate

# Ejecuta las migraciones
npm run db:migrate

# Si nada funciona, resetea la base de datos (CUIDADO: borra todos los datos)
npm run db:reset
```

## Variables de Entorno

### Las variables de entorno no se cargan

**Causa**: El archivo `.env.local` no existe o tiene el nombre incorrecto.

**Solución**:

1. Verifica que el archivo se llame exactamente `.env.local` (no `.env` o `.env.development`)

2. El archivo debe estar en la raíz del proyecto:
   ```
   barberpro-nuevo/
   ├── .env.local          ← Aquí
   ├── src/
   ├── package.json
   └── ...
   ```

3. Reinicia el servidor después de crear o modificar `.env.local`

### Cómo verificar que las variables estén cargadas

En `src/lib/auth.ts`, agrega temporalmente:

```typescript
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('Has Google credentials:', !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET));
```

Revisa la consola del servidor cuando inicies la aplicación.

## Logs y Debugging

### Cómo ver los logs del servidor

Los logs aparecen en la terminal donde ejecutas `npm run dev`:

```bash
npm run dev

# Deberías ver errores aquí
# Ejemplo:
# Error en registro: PrismaClientKnownRequestError: ...
```

### Cómo ver los logs del navegador

1. Abre las herramientas de desarrollo (F12)
2. Ve a la pestaña "Console"
3. Reproduce el error
4. Los errores de red aparecerán aquí

### Habilitar logs detallados de NextAuth

En `src/lib/auth.ts`, agrega:

```typescript
export const authOptions: NextAuthOptions = {
  debug: true, // Agrega esta línea
  providers: [
    // ...
  ],
  // ...
};
```

Reinicia el servidor y verás logs detallados de NextAuth en la consola.

## Comandos Útiles

```bash
# Ver estado de la base de datos
npm run db:studio

# Regenerar cliente de Prisma
npm run db:generate

# Aplicar migraciones pendientes
npm run db:migrate

# Resetear base de datos (borra todos los datos)
npm run db:reset

# Sembrar datos de prueba
npm run db:seed

# Ver logs de PostgreSQL (Linux)
sudo journalctl -u postgresql -f

# Verificar conexión a la base de datos
psql -U barberpro -d barberpro -c "SELECT current_database(), current_user;"
```

## Necesitas Más Ayuda

Si ninguna de estas soluciones funciona:

1. Revisa los logs completos del servidor
2. Revisa los logs de PostgreSQL
3. Verifica que todas las dependencias estén instaladas: `npm install`
4. Intenta con una base de datos limpia: `npm run db:reset` (cuidado: borra todo)
5. Verifica que estés usando las versiones correctas de Node.js (v18+) y PostgreSQL (v14+)

## Errores Comunes de Configuración

### Checklist de configuración correcta

- [ ] PostgreSQL está ejecutándose
- [ ] La base de datos `barberpro` existe
- [ ] Las migraciones están aplicadas (`npm run db:migrate`)
- [ ] El archivo `.env.local` existe en la raíz
- [ ] `DATABASE_URL` en `.env.local` es correcto
- [ ] `NEXTAUTH_URL` en `.env.local` es correcto
- [ ] `NEXTAUTH_SECRET` en `.env.local` existe
- [ ] El servidor se reinició después de cambiar `.env.local`
- [ ] No hay errores en la consola del servidor al iniciar

Si todos estos puntos están correctos, la aplicación debería funcionar.
