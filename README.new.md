# BarberPro - Sistema de Gestión de Barbería

Sistema completo de gestión para barberías con sitio público, área de clientes y panel administrativo.

**Stack:** Next.js 15 + TypeScript + PostgreSQL + Prisma + NextAuth + Tailwind CSS + shadcn/ui

---

## 🚀 Quick Start

### Requisitos
- Node.js 20+
- PostgreSQL 15+ (o Docker)
- npm o pnpm

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd barberpro

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Levantar base de datos con Docker
docker-compose up -d postgres

# 5. Ejecutar migraciones
npm run db:migrate

# 6. Seed de datos iniciales
npm run db:seed

# 7. Iniciar servidor de desarrollo
npm run dev
```

La app estará corriendo en http://localhost:3000

### Usuarios de prueba (después del seed)

```
Admin:
- Email: admin@barberpro.com
- Password: Admin123!

Cliente:
- Email: juan@example.com
- Password: User123!

Staff:
- Email: carlos@barberpro.com
- Password: User123!
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Rutas públicas
│   ├── (auth)/             # Login/Registro
│   ├── (dashboard)/        # Área clientes
│   │   └── admin/          # Panel admin
│   └── api/                # API Routes
├── components/             # Componentes React
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Componentes custom
├── lib/                    # Utilidades y config
├── server/                 # Backend logic
│   ├── services/           # Business logic
│   └── repositories/       # Data access
├── db/                     # Prisma
│   ├── schema.prisma       # Schema de BD
│   └── seed.ts             # Seed de datos
└── types/                  # TypeScript types
```

---

## 🗂️ Features

### Sitio Público
- ✅ Landing page con información de la barbería
- ✅ Catálogo de servicios con precios
- ✅ Galería de trabajos
- ✅ Información de barberos
- ✅ Ubicación y contacto
- ✅ Sistema de reservas online

### Área de Clientes
- ✅ Dashboard personal
- ✅ Gestión de reservas (crear, cancelar, reprogramar)
- ✅ Historial de cortes con fotos
- ✅ Edición de perfil

### Panel Administrativo
- ✅ Dashboard con métricas y estadísticas
- ✅ Gestión de clientes (CRUD + historial)
- ✅ Gestión de turnos (calendario, confirmaciones)
- ✅ Gestión de servicios y precios
- ✅ Gestión de barberos/staff
- ✅ Configuración de horarios y cierres
- ✅ Registros de servicios con fotos
- ✅ Logs de auditoría

---

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run start            # Servidor de producción

# Database
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Seed de datos
npm run db:studio        # Prisma Studio (DB GUI)
npm run db:reset         # Reset completo de BD

# Calidad de código
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript check

# Testing
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:coverage    # Coverage report
```

---

## 🐳 Docker

### Desarrollo con Docker Compose

```bash
# Levantar todo (app + postgres)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Ejecutar comandos dentro del container
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed

# Detener
docker-compose down
```

### Build para Producción

```bash
# Build imagen de producción
docker build -f docker/Dockerfile --target production -t barberpro:latest .

# Run
docker run -p 3000:3000 --env-file .env.local barberpro:latest
```

---

## 🚢 Deploy

### Vercel (Recomendado)

1. Push código a GitHub
2. Conectar repo en Vercel
3. Configurar variables de entorno
4. Deploy automático

**Database:** Usar Vercel Postgres, Neon o Supabase

### Railway

1. Conectar repo de GitHub en Railway
2. Agregar PostgreSQL addon
3. Configurar env vars
4. Deploy automático

### VPS (Ubuntu/Docker)

Ver guía completa en `ARCHITECTURE.md` sección 9.5

---

## 📖 Documentación

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Arquitectura técnica completa
- **[MIGRATION.md](./MIGRATION.md)**: Guía de migración desde proyecto actual

---

## 🔒 Seguridad

- ✅ Autenticación con NextAuth (bcrypt + JWT)
- ✅ RBAC (Role-Based Access Control)
- ✅ Rate limiting en endpoints críticos
- ✅ Validación con Zod en toda la API
- ✅ CSRF protection (Next.js Server Actions)
- ✅ Headers de seguridad (CSP, HSTS, etc.)
- ✅ SQL injection prevention (Prisma)

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📝 License

MIT

---

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Add nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

## 💬 Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub.

---

**Desarrollado con ❤️ para barberías modernas**
