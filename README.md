# Java Quest - Proyecto React listo para Vercel

Este proyecto convierte el archivo `JavaQuest.jsx` en una aplicación React desplegable con Vite.

## Importante

No abras `index.html` con doble clic. Si lo haces, el navegador puede mostrar una página en blanco o solo el mensaje de carga, porque el navegador no compila JSX ni resuelve los imports de React por sí solo.

## Probar localmente

Abre una terminal dentro de esta carpeta y ejecuta:

```bash
npm install
npm run dev
```

Luego abre la URL que aparece en la terminal, normalmente:

```text
http://localhost:5173/
```

## Desplegar en Vercel desde GitHub

1. Sube la carpeta completa al repositorio, no solo el `index.html`.
2. En Vercel, importa el repositorio desde GitHub.
3. Usa esta configuración:
   - Framework Preset: `Vite`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Haz clic en Deploy.

## Estructura necesaria

```text
javaquest-vercel-corregido/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```
