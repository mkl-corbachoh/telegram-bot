FROM node:24-alpine

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de dependencias
# COPY ./src/package*.json ./
COPY ./src .

# actualiza npm a la versión 11.4.1
RUN npm install -g npm@11.4.1

# Instala las dependencias
RUN npm install

# Comando por defecto para iniciar la app
CMD ["npm", "start"]