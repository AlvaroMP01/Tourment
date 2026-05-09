FROM mirror.gcr.io/library/node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0"]
