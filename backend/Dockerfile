FROM php:8.2-cli

# 1. Instalar dependencias de Linux y extensiones de PHP para PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# 2. Copiar el ejecutable de Composer al contenedor
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 3. Habilitar que Composer corra como superusuario en entornos de CI/CD
ENV COMPOSER_ALLOW_SUPERUSER=1

# 4. Configurar el directorio de trabajo
WORKDIR /var/www/html

# 5. ¡EL CAMBIO CLAVE! Copiar solo el contenido de la subcarpeta backend
COPY backend/ .

# 6. Instalar las dependencias de Laravel optimizadas para producción
RUN composer install --no-dev --optimize-autoloader

# 7. Exponer el puerto del servicio
EXPOSE 8000

# 8. Arrancar el servidor en formato JSON (Evita advertencias en Railway)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
