FROM node:22
WORKDIR /app
COPY package*.json .
RUN npm i
COPY /src /app/src
COPY prisma /app/prisma
COPY inventory-service /app/inventory-service
COPY prisma.config.ts /app/
CMD ["npm","run","dev"]