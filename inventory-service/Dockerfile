FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate --config prisma.config.ts
COPY src ./src
CMD ["npm", "run", "dev"]
