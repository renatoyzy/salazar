FROM node:22-slim

WORKDIR /app

COPY package.json .
COPY . .
RUN npm install

CMD ["node", "index.js"]