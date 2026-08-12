# Ludoteca Maldita · Narrador Central v3.2.20

Versión preparada para GitHub Pages.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube **todo el contenido de esta carpeta a la raíz del repositorio** (index.html, assets, manifest.webmanifest, sw.js, .nojekyll...).
3. En GitHub entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)` y guarda.

La web se abrirá desde la URL que GitHub Pages indique.

## Incluido

- Vídeo de introducción.
- Narración inicial de Arconte.
- BSO en bucle.
- Narraciones profesionales integradas de El reactivo de West y La Novia del Re-Animator.
- Modo multijugador disponible en la propia app.
- PWA/manifest y service worker.

## Importante

GitHub Pages es alojamiento estático. Las funciones que dependan del servidor Node/API de sincronización central no pueden ejecutarse directamente en GitHub Pages. La app, sus recursos integrados y las narraciones locales sí funcionan desde el sitio estático.


## Corrección audio GitHub Pages
Esta edición incluye físicamente `assets/narrations/west/` y `assets/narrations/bride/`, necesarias para las locuciones profesionales integradas.
