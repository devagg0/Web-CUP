FROM php:8.2-cli



# 1. Instalar dependencias del sistema y extensiones de PHP para PostgreSQL

RUN apt-get update && apt-get install -y \

    git \

    unzip \

    libpq-dev \

    && docker-php-ext-install pdo pdo_pgsql



# 2. Copiar el ejecutable de Composer

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer



# 3. Configurar el directorio de trabajo limpio

WORKDIR /var/www/html



# 4. ¡PRIMERO COPIAR EL CÓDIGO! (Vital para que Composer encuentre el composer.json)

COPY backend/ .



# 5. Configurar permisos de superusuario e instalar dependencias

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN composer install --no-dev --optimize-autoloader



# 6. Exponer el puerto

EXPOSE 8000



# 7. Comando de arranque estructurado en JSON

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"] 

