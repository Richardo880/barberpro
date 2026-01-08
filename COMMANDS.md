# Comandos Útiles

## Gestión de puertos

### Verificar qué proceso está usando el puerto 3000
```bash
sudo fuser -v 3000/tcp
```

### Matar el proceso que está usando el puerto 3000
```bash
sudo fuser -k 3000/tcp
```

### Ver todos los puertos en uso
```bash
sudo netstat -tulpn | grep LISTEN
```

### Alternativa con lsof
```bash
sudo lsof -i :3000
```

## Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

### Previsualizar build de producción
```bash
npm run preview
```

## Base de datos

### Generar cliente Prisma
```bash
npx prisma generate
```

### Aplicar migraciones
```bash
npx prisma migrate dev
```

### Abrir Prisma Studio
```bash
npx prisma studio
```

### Reset de base de datos (cuidado en producción)
```bash
npx prisma migrate reset
```

## Git

### Ver estado
```bash
git status
```

### Ver diferencias
```bash
git diff
```

### Commits recientes
```bash
git log --oneline -10
```
