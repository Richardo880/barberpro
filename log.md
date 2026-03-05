# Cambios realizados - Sesión 2026-03-04

## 1. SEO: H1 en página principal
**Archivo:** `src/app/(public)/page.tsx`
- Se agregó `<h1>Barbería Imperio</h1>` en la hero section, entre el logo y los botones CTA
- Clases: `mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-stone-100 drop-shadow-lg`

## 2. Rebranding: BarberPro → Barbería Imperio

### Footer (`src/components/layout/footer.tsx`)
- Logo: "BP" → "BI"
- Nombre: "BarberPro" → "Barbería Imperio"
- Copyright: "BarberPro" → "Barbería Imperio"
- Teléfono actualizado: `+595 994 625345`
- Email actualizado: `info@barberiaimperio.com`
- Ubicación actualizada: `San Lorenzo, Paraguay`

### Auth layout (`src/app/(auth)/layout.tsx`)
- Logo: "BP" → "BI"
- Nombre: "BarberPro" → "Barbería Imperio"

### Registro (`src/app/(auth)/registro/page.tsx`)
- Texto: "crear tu cuenta en BarberPro" → "crear tu cuenta en Barbería Imperio"

## 3. Nueva sección "Visitanos" en landing page
**Archivo:** `src/app/(public)/page.tsx`

Se añadió `LocationSection` entre `StaffSection` y `CTASection`.

### Estructura:
- **Background:** imagen `front.jpeg` con `bg-cover bg-center bg-fixed` y overlay oscuro
- **Título:** card con glass effect, h2 "Visitanos" + subtítulo "Conocé nuestro espacio"

### Fila de fotos (3 columnas en desktop):
- `front.jpeg` — Fachada (aspect 4/3)
- `inside1.jpeg` — Interior (aspect 4/3)
- `inside2.jpeg` — Interior (aspect 4/3)
- Responsive: 2 cols en tablet (tercera imagen span full), 1 col en mobile

### Fila mapa + Instagram (3 columnas en desktop):
- **Google Maps iframe** (col-span-2 en lg): coordenadas `-25.3029776, -57.5281079` (San Lorenzo)
- **Card de Instagram** (1 col): link a `@barberia_imperio_0` con ícono SVG, hover effects
- Responsive: stack vertical en mobile/tablet

### Imágenes utilizadas:
- `/images/menu/front.jpeg`
- `/images/menu/inside1.jpeg`
- `/images/menu/inside2.jpeg`

### Instagram:
- URL: `https://www.instagram.com/barberia_imperio_0`
- Handle mostrado: `@barberia_imperio_0`

### Google Maps embed URL:
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.5!2d-57.5281079!3d-25.3029776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945daf17a6b87c33%3A0x23857ff0ce48c8fc!2z!5e0!3m2!1ses!2spy!4v1700000000000
```
