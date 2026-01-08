# Configurar PostgreSQL Local

Como Docker no está instalado, usaremos PostgreSQL local.

## Paso 1: Crear base de datos y usuario

```bash
# Crear usuario barberpro
sudo -u postgres psql -c "CREATE USER barberpro WITH PASSWORD 'password';"

# Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE barberpro OWNER barberpro;"

# Dar permisos
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE barberpro TO barberpro;"
```

## Paso 2: Ejecutar migraciones

```bash
cd /home/ricardo/barberpro-nuevo

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Ejecutar seed
npx prisma db seed
```

## Paso 3: Verificar

```bash
# Abrir Prisma Studio
npx prisma studio

# En otra terminal, iniciar Next.js
npm run dev
```

## Si hay problemas de conexión

Si PostgreSQL no acepta conexiones locales, edita:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Agrega esta línea:
```
local   all             barberpro                               md5
```

Reinicia PostgreSQL:
```bash
sudo service postgresql restart
```
