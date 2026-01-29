# Inicio Rápido - Autenticación

Guía rápida para poner en marcha el sistema de autenticación en BarberPro.

## 🚀 Setup Rápido (5 minutos)

### 1. Iniciar PostgreSQL con Docker

```bash
# Iniciar la base de datos
npm run docker:up

# Verificar que está ejecutándose
docker ps | grep barberpro-db
```

Deberías ver algo como:
```
barberpro-db   postgres:15-alpine   Up 10 seconds   5432/tcp
```

### 2. Ejecutar Migraciones

```bash
# Generar el cliente de Prisma
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# (Opcional) Sembrar datos de prueba
npm run db:seed
```

### 3. Verificar Configuración

```bash
# Ejecutar script de verificación
npm run check:auth
```

Deberías ver:
```
✅ .env.local existe
✅ DATABASE_URL está configurado
✅ NEXTAUTH_URL está configurado
✅ NEXTAUTH_SECRET está configurado
⚠️  Google OAuth NO está configurado (opcional)
✅ Conexión a PostgreSQL exitosa
✅ Tabla 'users' existe
✅ Tabla 'client_profiles' existe
✅ ¡Configuración de autenticación correcta!
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

### 5. Probar la Aplicación

1. Ve a `http://localhost:3000`
2. Haz clic en "Regístrate"
3. Completa el formulario:
   - Nombre: Tu Nombre
   - Email: tu@email.com
   - Contraseña: Password123
   - Confirmar Contraseña: Password123
4. ¡Listo! Deberías estar dentro de tu cuenta

## 🔧 Problemas Comunes

### ❌ "Cannot connect to database"

**Solución**:
```bash
# Verificar si PostgreSQL está ejecutándose
docker ps | grep barberpro-db

# Si no está, iniciarlo
npm run docker:up

# Ver logs si hay problemas
npm run docker:logs
```

### ❌ "Relation 'users' does not exist"

**Solución**:
```bash
# Ejecutar migraciones
npm run db:migrate
```

### ❌ "NEXTAUTH_SECRET is not set"

**Solución**:
```bash
# Verificar que .env.local existe
cat .env.local | grep NEXTAUTH_SECRET

# Debería mostrar algo como:
# NEXTAUTH_SECRET="5dW9L8v4jr7eBz3ICgrjD+lPMR3mj+S6nrHeNscM5AA="
```

Si está vacío, genera uno nuevo:
```bash
openssl rand -base64 32
```

Y agrégalo a `.env.local`:
```env
NEXTAUTH_SECRET="tu-secret-generado"
```

## 📱 Configurar Google OAuth (Opcional)

Si quieres permitir login con Google:

1. Sigue la guía completa: `docs/GOOGLE_OAUTH_SETUP.md`

2. Agrega las credenciales a `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-client-secret"
   ```

3. Reinicia el servidor:
   ```bash
   npm run dev
   ```

4. El botón de Google aparecerá en la página de login

## 🧪 Testing

### Manual
```bash
# Iniciar servidor
npm run dev

# Abrir navegador en http://localhost:3000
# Probar registro y login
```

### Automatizado
```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests de integración (requiere servidor corriendo)
npm run dev  # En una terminal
npm test -- register.integration.test.ts  # En otra terminal
```

## 📊 Ver Base de Datos

```bash
# Abrir Prisma Studio (interfaz visual)
npm run db:studio

# Se abrirá en http://localhost:5555
```

## 🛑 Detener Todo

```bash
# Detener servidor (Ctrl+C en la terminal donde corre npm run dev)

# Detener PostgreSQL
npm run docker:down
```

## 🔄 Resetear Base de Datos

Si necesitas empezar de cero:

```bash
# CUIDADO: Esto borra TODOS los datos
npm run db:reset

# Sembrar datos de prueba nuevamente
npm run db:seed
```

## 📚 Más Información

- **Guía completa de Google OAuth**: `docs/GOOGLE_OAUTH_SETUP.md`
- **Testing detallado**: `docs/TESTING_AUTH.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING_AUTH.md`
- **Tests**: `TESTING.md`

## ✅ Checklist de Setup Completo

- [ ] PostgreSQL ejecutándose (`docker ps`)
- [ ] Migraciones aplicadas (`npm run db:migrate`)
- [ ] `.env.local` configurado
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Registro funciona (`http://localhost:3000/registro`)
- [ ] Login funciona (`http://localhost:3000/login`)
- [ ] Google OAuth configurado (opcional)

## 🎯 Próximos Pasos

Una vez que la autenticación funciona:

1. **Crear un usuario admin** para probar el panel de administración
2. **Configurar Google OAuth** para producción (si lo necesitas)
3. **Ejecutar tests** para verificar todo
4. **Revisar la documentación** para features avanzadas

## 💡 Tips

- Usa el comando `npm run check:auth` antes de empezar a desarrollar cada día
- Mantén `docker ps` y `npm run docker:logs` a mano para debug
- `npm run db:studio` es tu mejor amigo para ver y editar datos
- Los logs del servidor (terminal de `npm run dev`) son muy útiles

## 🆘 Ayuda

Si algo no funciona después de seguir esta guía:

1. Ejecuta `npm run check:auth` y mira qué falla
2. Revisa `docs/TROUBLESHOOTING_AUTH.md`
3. Verifica los logs del servidor
4. Verifica los logs de PostgreSQL: `npm run docker:logs`
