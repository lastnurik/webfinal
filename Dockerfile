FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]

