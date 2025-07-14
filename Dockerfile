# Usa una imagen base de Node.js, ideal para proyectos web y Puppeteer.
FROM node:20-alpine

# Instala las dependencias del sistema necesarias para que Chromium funcione.
# Para Alpine, esta lista es más compacta. `chromium` es el paquete principal.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && fc-cache -f

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copia solo los archivos de dependencias para aprovechar el cache de Docker.
COPY package*.json ./

# Instala las dependencias de Node.js.
RUN npm install

# Copia el resto del código al contenedor.
COPY . .

