# Гайд з локалізації помилки React #418 (Hydration Mismatch)

## Що таке помилка React #418?

React Error #418 - це помилка **hydration mismatch** (невідповідність гідрації), яка виникає коли HTML згенерований на сервері не співпадає з тим, що React очікує побачити на клієнті.

## Як локалізувати помилку

### 1. Запустіть проект в режимі розробки (development)

У production режимі помилки мінімізовані. Для детальної інформації:

```bash
npm run dev
# або
yarn dev
```

### 2. Відкрийте консоль браузера

React покаже **точний компонент і текст**, де відбувається mismatch:

```
Warning: Text content did not match. Server: "Login" Client: "Avatar"
    at UserNav (components/user-nav.tsx:25)
```

### 3. Увімкніть React DevTools

Встановіть [React Developer Tools](https://react.dev/learn/react-developer-tools) для додаткової інформації про компоненти.

## Поширені причини hydration mismatch

### ❌ Неправильно: Перевірка `isMounted`

```tsx
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

if (!isMounted) {
  return <div>Loading...</div> // ❌ Сервер показує одне, клієнт інше
}

return <div>Real content</div>
```

### ✅ Правильно: Використовуйте `suppressHydrationWarning`

```tsx
// Для компонентів які залежать від клієнтського стану
<div suppressHydrationWarning>
  {typeof window !== 'undefined' && <ClientOnlyComponent />}
</div>
```

### ❌ Неправильно: Використання Date.now(), Math.random()

```tsx
// ❌ Сервер і клієнт генерують різні значення
<div id={`item-${Math.random()}`}>Content</div>
<div>{new Date().toLocaleTimeString()}</div>
```

### ✅ Правильно: Генеруйте значення один раз

```tsx
// ✅ Передайте значення через props з сервера
<div id={`item-${stableId}`}>Content</div>

// Або використовуйте useEffect для клієнтських значень
const [time, setTime] = useState<string>()

useEffect(() => {
  setTime(new Date().toLocaleTimeString())
}, [])
```

### ❌ Неправильно: Використання localStorage/sessionStorage

```tsx
// ❌ На сервері немає доступу до localStorage
const theme = localStorage.getItem('theme') || 'light'
return <div className={theme}>Content</div>
```

### ✅ Правильно: Перевірте наявність window

```tsx
const [theme, setTheme] = useState('light')

useEffect(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    setTheme(savedTheme)
  }
}, [])
```

## Виправлені проблеми в цьому проекті

### 1. ContactSection - видалено `isMounted`

**Було:**
```tsx
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

if (!isMounted) {
  return <div>Loading...</div> // ❌ Mismatch!
}
```

**Стало:**
```tsx
// Компонент рендериться одразу без перевірки isMounted
export function ContactSection() {
  const [name, setName] = useState("")
  // ... інші стани
  
  return <section>...</section> // ✅ Однаковий рендер
}
```

### 2. InfoBannerClient - додано suppressHydrationWarning

**Було:**
```tsx
const [isMounted, setIsMounted] = useState(false)

if (!isMounted) {
  return null // ❌ Сервер: null, Клієнт: <Alert>
}
```

**Стало:**
```tsx
<Alert suppressHydrationWarning>
  {/* Контент */}
</Alert>
```

### 3. UserNav - додано suppressHydrationWarning

**Було:**
```tsx
if (!user) {
  return <Button>Login</Button>
}
return <Avatar>...</Avatar>
```

**Стало:**
```tsx
if (!user) {
  return (
    <Link href="..." suppressHydrationWarning>
      <Button>Login</Button>
    </Link>
  )
}
return (
  <DropdownMenu>
    <DropdownMenuTrigger suppressHydrationWarning>
      <Avatar>...</Avatar>
    </DropdownMenuTrigger>
  </DropdownMenu>
)
```

## Інструменти для дебагу

### Chrome DevTools

1. Відкрийте **Elements** tab
2. Знайдіть елемент з помилкою
3. Подивіться чи співпадає HTML з очікуваним

### React DevTools Profiler

1. Встановіть React DevTools
2. Відкрийте **Profiler** tab
3. Запишіть рендеринг сторінки
4. Знайдіть компоненти з довгим часом рендерингу

### Console Warnings

React автоматично показує попередження:
- `Text content did not match` - текст не співпадає
- `Prop X did not match` - атрибут не співпадає
- `Expected server HTML to contain...` - очікувана структура

## Чеклист перевірки

- [ ] Немає `Date.now()` або `Math.random()` в JSX
- [ ] Немає прямого доступу до `localStorage`/`sessionStorage` в рендері
- [ ] Немає перевірок `isMounted` без `suppressHydrationWarning`
- [ ] Клієнтські компоненти позначені `"use client"`
- [ ] Серверні дані передаються через props
- [ ] Динамічні ідентифікатори генеруються стабільно

## Корисні посилання

- [React Hydration Errors](https://react.dev/reference/react-dom/client/hydrateRoot#hydration-mismatch-errors)
- [Next.js Hydration Error](https://nextjs.org/docs/messages/react-hydration-error)
- [suppressHydrationWarning](https://react.dev/reference/react-dom/components/common#common-props)
