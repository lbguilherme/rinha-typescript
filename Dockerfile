FROM node:alpine
WORKDIR /app
ADD package*.json .
RUN npm ci
ADD . .
CMD ["node", "src/run.mjs", "/var/rinha/source.rinha"]
