FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js .
COPY status.json .
COPY 単語例文.json .
EXPOSE 3001
CMD ["node", "server.js"]