export interface PayloadUser {
  id: string
  email: string
  [key: string]: unknown
}

/**
 * Повертає користувача з JWT / cookies або `null`, якщо неавторизований.
 * Наразі це базова «заглушка», щоб виправити помилку компіляції.
 */
export async function getUser(): Promise<PayloadUser | null> {
  // TODO: реалізувати справжню логіку отримання користувача
  try {
    // приклад: const token = cookies().get('session')?.value
    return null
  } catch {
    return null
  }
}
