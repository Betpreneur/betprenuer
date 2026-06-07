FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@11.6.2 && npm install

COPY . .

ARG VITE_API_BASE_URL=https://api.betpreneur.ng/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
