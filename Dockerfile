FROM node:24.21.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
RUN apt-get update && apt-get install -y build-essential
RUN npm rebuild sqlite3

COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]