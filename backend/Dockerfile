FROM node:20-alpine

# 1. Configurar el directorio de trabajo dentro del contenedor
WORKDIR /app

# 2. Copiar los archivos de configuración de dependencias desde la subcarpeta frontend
COPY frontend/package*.json ./

# 3. Instalar las dependencias de Node de forma limpia
RUN npm install

# 4. Copiar todo el código de React desde la subcarpeta frontend al contenedor
COPY frontend/ .

# 5. Exponer el puerto nativo de Vite
EXPOSE 5173

# 6. Arrancar el servidor de desarrollo exponiendo el host para Railway
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
