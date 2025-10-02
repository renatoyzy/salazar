FROM docker.io/node:22-alpine AS runner

WORKDIR /app

COPY package.json .
COPY . .
RUN npm install

CMD ["node", "index.js"]