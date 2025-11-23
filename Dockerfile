FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json jest.config.cjs ./
COPY src ./src
COPY tests ./tests

RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]

