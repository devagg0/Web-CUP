FROM node:20-alpine

WORKDIR /app

# 1. Copiar los archivos de configuración desde la subcarpeta frontend
COPY frontend/package*.json ./

# 2. Instalar las dependencias de Node
RUN npm install

# 3. Copiar solo el código de la subcarpeta frontend al contenedor
COPY frontend/ .

# 4. Exponer el puerto de Vite
EXPOSE 5173

# 5. Arrancar el servidor en formato JSON con el puerto explícito para Railway
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
