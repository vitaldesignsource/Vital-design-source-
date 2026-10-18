FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL
RUN test -n "$SITE_URL" && SITE_URL="$SITE_URL" npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 DATABASE_PATH=/app/data/inquiries.sqlite
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build
RUN mkdir /app/data && chown node:node /app/data && chmod 700 /app/data
USER node
EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "start"]
