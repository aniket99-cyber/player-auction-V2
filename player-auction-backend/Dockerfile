FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "dist/server.js"]
