# Використовуємо офіційний Node.js образ як базовий
FROM node:20-alpine AS base

# Встановлюємо робочу директорію
WORKDIR /app

# Встановлюємо залежності для нативних модулів
RUN apk add --no-cache libc6-compat

# Етап встановлення залежностей
FROM base AS deps

# Копіюємо маніфест і lock-файл. Обидва файли обовʼязкові: npm ci падає без
# lock-файла, і це навмисно — так образ збирається з тих самих версій, що й
# локально, а не з того, що npm віддасть у день збірки.
COPY package.json package-lock.json ./

# npm ci ставить рівно те, що записано в lock-файлі, і не змінює його
RUN npm ci

# Етап збірки
FROM base AS builder

WORKDIR /app

# Копіюємо залежності з попереднього етапу
COPY --from=deps /app/node_modules ./node_modules

# Копіюємо весь код проекту
COPY . .

# Приймаємо тільки публічні АРГументи (які безпечно включаються в образ)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAINTENANCE_MODE
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID

# Встановлюємо публічні змінні для білду
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_MAINTENANCE_MODE=${NEXT_PUBLIC_MAINTENANCE_MODE}
ENV NEXT_PUBLIC_DEFAULT_LOCALE=${NEXT_PUBLIC_DEFAULT_LOCALE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_FACEBOOK_PIXEL_ID=${NEXT_PUBLIC_FACEBOOK_PIXEL_ID}

# Відключаємо телеметрію Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Встановлюємо заглушку для приватних ключів що не потрібні при білді
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder_build_only
ENV NEXTAUTH_SECRET=placeholder_build_only

# Обмежуємо heap на час збірки, щоб збірка не з'їла всю память контейнера
ENV NODE_OPTIONS=--max-old-space-size=2048

# Запускаємо збірку
RUN npm run build

# Етап production
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Створюємо користувача для безпеки
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копіюємо public файли
COPY --from=builder /app/public ./public

# Копіюємо standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Перемикаємося на користувача nextjs
USER nextjs

# Відкриваємо порт 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Обмежуємо heap Node. Без цього V8 орієнтується на памʼять усього хоста,
# доходить до ліміту контейнера й процес отримує OOM-kill (код 137), після
# чого Coolify перезапускає контейнер по колу. Значення має бути меншим за
# ліміт памʼяті контейнера — підніміть його, якщо ліміт більший.
ENV NODE_OPTIONS=--max-old-space-size=1536

# Healthcheck. В node:20-alpine немає curl, тому перевіряємо самим Node.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Запускаємо додаток
CMD ["node", "server.js"]
