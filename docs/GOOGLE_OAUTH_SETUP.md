# Configuración de Google OAuth para BarberPro

Esta guía te ayudará a configurar la autenticación con Google en tu aplicación BarberPro.

## Paso 1: Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** > **Credentials**

## Paso 2: Configurar OAuth Consent Screen

1. En el menú lateral, selecciona **OAuth consent screen**
2. Selecciona **External** como tipo de usuario
3. Haz clic en **CREATE**
4. Completa la información requerida:
   - **App name**: BarberPro
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
5. En **Scopes**, agrega:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Haz clic en **SAVE AND CONTINUE**

## Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **Credentials** en el menú lateral
2. Haz clic en **CREATE CREDENTIALS** > **OAuth client ID**
3. Selecciona **Web application** como tipo de aplicación
4. Configura los siguientes campos:

   **Name**: BarberPro Web Client

   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://tu-dominio.com
   ```

   **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://tu-dominio.com/api/auth/callback/google
   ```

5. Haz clic en **CREATE**
6. Copia el **Client ID** y **Client Secret** que aparecen

## Paso 4: Configurar Variables de Entorno

1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Actualiza las siguientes variables:

```env
# OAuth Google
GOOGLE_CLIENT_ID="tu-client-id-aqui.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret-aqui"
```

3. Guarda el archivo

## Paso 5: Reiniciar el Servidor de Desarrollo

```bash
npm run dev
```

## Paso 6: Probar la Autenticación

1. Ve a `http://localhost:3000/login`
2. Haz clic en el botón **Google**
3. Selecciona tu cuenta de Google
4. Autoriza el acceso a la aplicación
5. Deberías ser redirigido a `/mi-cuenta` después de autenticarte

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: La URL de redirección no coincide con las configuradas en Google Cloud Console.

**Solución**:
1. Verifica que la URL exacta esté agregada en **Authorized redirect URIs**
2. Asegúrate de incluir `/api/auth/callback/google` al final
3. Si estás en desarrollo, usa `http://localhost:3000/api/auth/callback/google`

### Error: "access_denied"

**Causa**: El usuario canceló la autorización o la aplicación no está publicada.

**Solución**:
1. En modo desarrollo, esto es normal. Google mostrará una advertencia.
2. Haz clic en "Avanzado" > "Ir a BarberPro (no seguro)" para continuar
3. Para producción, deberás verificar la aplicación con Google

### El botón de Google no aparece

**Causa**: Las variables de entorno no están configuradas correctamente.

**Solución**:
1. Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén en `.env.local`
2. Asegúrate de que no estén vacías
3. Reinicia el servidor de desarrollo después de cambiar las variables

### Error: "User registered with OAuth, cannot login with credentials"

**Causa**: Un usuario que se registró con Google intenta hacer login con email/password.

**Solución**:
- Los usuarios que se registraron con Google deben continuar usando Google para iniciar sesión
- No pueden crear una contraseña después
- Si necesitan cambiar, deberán crear una nueva cuenta con email/password

## Usuarios de Prueba (Desarrollo)

Durante el desarrollo, solo los usuarios que agregues como "Test users" en el OAuth consent screen podrán autenticarse:

1. Ve a **OAuth consent screen**
2. En la sección **Test users**, haz clic en **ADD USERS**
3. Agrega los emails de las cuentas de Google que usarás para probar
4. Haz clic en **SAVE**

## Publicar la Aplicación (Producción)

Para permitir que cualquier usuario se autentique con Google:

1. Ve a **OAuth consent screen**
2. Haz clic en **PUBLISH APP**
3. Completa el proceso de verificación de Google (puede tomar varios días)

**Nota**: Mientras la aplicación esté en modo "Testing", solo los usuarios de prueba podrán autenticarse.

## Seguridad

### Mejores Prácticas

1. **Nunca** commitees el archivo `.env.local` a Git
2. Rota tus secretos regularmente
3. Usa diferentes credenciales para desarrollo y producción
4. Limita los scopes de OAuth a solo lo necesario
5. Revisa periódicamente los usuarios autorizados

### Variables de Entorno en Producción

Para producción (por ejemplo, Vercel):

1. Ve a **Settings** > **Environment Variables**
2. Agrega `GOOGLE_CLIENT_ID` con el valor de producción
3. Agrega `GOOGLE_CLIENT_SECRET` con el valor de producción
4. Asegúrate de que `NEXTAUTH_URL` apunte a tu dominio de producción

## Recursos Adicionales

- [NextAuth.js Google Provider Documentation](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## Soporte

Si encuentras problemas:

1. Verifica los logs del servidor (`npm run dev`)
2. Revisa la consola del navegador para errores
3. Asegúrate de que todas las URLs estén correctamente configuradas
4. Verifica que las variables de entorno estén cargadas (reinicia el servidor después de cambiarlas)
