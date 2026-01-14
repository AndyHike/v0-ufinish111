# Використовуємо офіційний Node.js образ як базовий
FROM node:20-alpine AS base

# Встановлюємо робочу директорію
WORKDIR /app

# Встановлюємо залежності для нативних модулів
RUN apk add --no-cache libc6-compat

# Етап встановлення залежностей
FROM base AS deps

# Копіюємо файли package.json та package-lock.json
COPY package.json package-lock.json* ./

# Встановлюємо залежності
RUN npm install

# Етап збірки
FROM base AS builder

WORKDIR /app

# Копіюємо залежності з попереднього етапу
COPY --from=deps /app/node_modules ./node_modules

# Копіюємо весь код проекту
COPY . .

# Створюємо .env файл з аргументів білда (для білд-часу)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAINTENANCE_MODE
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID

# Відключаємо телеметрію Next.js
ENV NEXT_TELEMETRY_DISABLED 1
# --- БЛОК SUPABASE ---

# 1. Ваші реальні дані (URL та ANON KEY)
ENV NEXT_PUBLIC_SUPABASE_URL=https://xnwoqomipsesacphoczp.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhud29xb21pcHNlc2FjcGhvY3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODk3NzEsImV4cCI6MjA2MDc2NTc3MX0.cTWJV3GXDS_LCS_UPqSP1Uni76PzzjOaoSLljNCUGmM

# 2. АЛЬТЕРНАТИВНІ НАЗВИ (Дублюємо ключ для сумісності)
# Якщо код шукає просто SUPABASE_KEY або SUPABASE_URL
ENV SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. ЗАГЛУШКА ДЛЯ СЕРВІСНОГО КЛЮЧА (Найважливіше!)
# Часто збірка падає, бо шукає цей ключ. Ми даємо фейковий, щоб заспокоїти перевірку.
# Реальний ключ підтягнеться з Portainer вже при запуску.
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder_key_for_build_process_only

# ---------------------

# Тільки після цього запускаємо збірку
RUN npm run build
# Збираємо проект
RUN npm run build

# Етап production
FROM base AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

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

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Запускаємо додаток
CMD ["node", "server.js"]
