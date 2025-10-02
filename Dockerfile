FROM node:22-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ligexpat1-dev \
    && rm -rf /var/lib/apt/lists*
    
WORKDIR /app

COPY package.json .
COPY . .
RUN npm install

CMD ["node", "index.js"]