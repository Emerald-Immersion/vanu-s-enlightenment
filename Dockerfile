FROM node:12

# Create app directory
WORKDIR /usr/src/app

RUN npm install

CMD [ "node", "index.js" ]