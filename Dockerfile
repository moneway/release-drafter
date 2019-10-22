FROM node:10-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY . .

EXPOSE 3000
ENTRYPOINT ["/app/node_modules/.bin/probot", "run", "./index.js"]
CMD ["--port=3000", "--webhook-path=/release-drafter"]
