# Directorio de Imágenes

Este directorio contiene las imágenes públicas del sistema.

## Estructura

- `staff/` - Fotos de perfil del personal (barberos)
- `services/` - Imágenes de referencia de los servicios
- `records/` - Fotos de trabajos realizados (antes/después)

## Uso

Las imágenes en estos directorios son accesibles públicamente mediante:
- `/images/staff/nombre-archivo.jpg`
- `/images/services/nombre-archivo.jpg`
- `/images/records/nombre-archivo.jpg`

## Recomendaciones

- Usar formatos JPG/PNG/WebP optimizados
- Tamaño máximo recomendado: 2MB por imagen
- Para fotos de staff: resolución 400x400px o similar
- Para fotos de services: resolución 800x600px (landscape) o 600x800px (portrait)
- Para fotos de records: resolución 800x600px o similar

## Agregar imágenes de servicios

1. Sube la imagen a `/public/images/services/`
2. En el panel admin, edita el servicio
3. Agrega la URL completa: `/images/services/nombre-archivo.jpg`
4. Guarda los cambios
