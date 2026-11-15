FROM node:22-alpine AS deck
ARG TALK=starter
ARG QR_URL
WORKDIR /deck
COPY deck/package*.json ./
RUN npm ci
COPY deck/ ./
# os tipos do protocolo ao vivo, que o deck importa de ../backstage/protocol.ts
COPY backstage/protocol.ts /backstage/protocol.ts
ENV TALK=$TALK NEXT_PUBLIC_QR_URL=$QR_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
ARG TALK=starter
WORKDIR /app
COPY backstage/package*.json ./
RUN npm ci --omit=dev
COPY backstage/ ./
COPY --from=deck /deck/out /app/deck
COPY deck/talks/${TALK}/deck.config.json /app/deck.config.json
# /data é do usuário node: um volume montado ali (métricas, token) nasce gravável
RUN mkdir -p /data && chown node:node /data
ENV PORT=8080 DECK_DIR=/app/deck DECK_CONFIG=/app/deck.config.json
EXPOSE 8080
USER node
CMD ["node", "server.ts"]
