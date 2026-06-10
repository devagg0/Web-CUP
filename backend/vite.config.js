import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        host: '0.0.0.0', // Obligatorio para que Railway intercepte el contenedor
        port: 5173,      // Fijamos el puerto de entrada asignado en las variables
        proxy: {
            // Redirige en la nube cualquier petición de API internamente al contenedor backend
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
                secure: false,
            }
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
