FROM node:alpine
WORKDIR /app
ADD package*.json /app/
RUN npm ci
ADD . /app/
CMD ["node", "src/run.mjs", "/var/rinha/source.rinha"]
