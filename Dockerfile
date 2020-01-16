FROM node:11.9.0 as builder

WORKDIR /builder
COPY . .
RUN npm install
RUN npm run build

FROM node:11.9.0 as runtime

WORKDIR /app

COPY --from=builder "/builder/dist/"               "/app/dist/"
COPY --from=builder "/builder/node_modules/"       "/app/node_modules/"
COPY --from=builder "/builder/ormconfig-prod.json" "/app/ormconfig.json"
COPY --from=builder "/builder/.env"                "/app/.env"

EXPOSE 3000

CMD ["node","dist/main"]