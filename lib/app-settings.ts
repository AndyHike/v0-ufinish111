/**
 * Простий модуль керування налаштуваннями застосунку.
 * За замовчуванням значення читаються із process.env.
 * За потреби можете замінити це зверненням до БД чи API.
 */

/* ---------- Типи ---------- */
export type AppSettingKey = "registration_enabled" | "maintenance_mode" | (string & {}) // дозволяє користувацькі ключі

/* ---------- Читання налаштувань ---------- */
export async function getAppSetting(key: AppSettingKey): Promise<string | null> {
  // 1. Спроба взяти з перемінних оточення
  const envKey = key.toUpperCase()
  if (envKey in process.env) {
    return process.env[envKey] ?? null
  }

  // 2. (Опційно) можна додати логіку читання з файлу або БД
  // Напр., const row = await db.setting.findUnique({ where: { key } })

  return null
}

/* ---------- Запис налаштувань ---------- */
export async function setAppSetting(key: AppSettingKey, value: string): Promise<void> {
  /**
   * Для production-версії тут слід зробити запис у БД або інший persistent storage.
   * У спрощеній реалізації просто виведемо попередження.
   */
  console.warn(`[AppSettings] setAppSetting("${key}", "${value}") викликано, але функція не реалізована (потрібна БД).`)
}

/* ---------- Спеціалізовані гелпери ---------- */

/**
 * Чи дозволена наразі реєстрація користувачів.
 * Повертає false, якщо налаштування відсутнє або має значення, відмінне від "true".
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  const setting = await getAppSetting("registration_enabled")
  return setting === "true"
}

/**
 * Чи ввімкнено режим технічних робіт.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const setting = await getAppSetting("maintenance_mode")
  return setting === "true"
}
