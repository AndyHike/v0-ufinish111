# Image Compression Guide (WebP)

## Огляд

Компонент `ImageUpload` тепер автоматично стискає всі зображення перед завантаженням у WebP формат. Це економить місце в БД і прискорює завантаження сторінок.

## Як працює

1. **Вибір файлу** - користувач вибирає PNG, JPG, GIF, WebP або інший формат
2. **Компресія** - на клієнтській стороні зображення автоматично:
   - Резалюється до 1920x1920px (зберігається співвідношення сторін)
   - Конвертується в WebP з якістю 80%
3. **Економія** - зазвичай 10MB → 0.5-1MB (90% економії!)
4. **Завантаження** - стиснутий файл завантажується на сервер

## Використання

### Базове

```tsx
import { ImageUpload } from "@/components/admin/image-upload"

export function MyComponent() {
  const handleImageUploaded = (imageUrl: string) => {
    console.log("Image uploaded:", imageUrl)
  }

  return <ImageUpload onImageUploaded={handleImageUploaded} />
}
```

### З кастомними параметрами

```tsx
<ImageUpload 
  onImageUploaded={handleImageUploaded}
  currentImageUrl="/images/existing.webp"
  maxWidth={1200}
  maxHeight={1200}
  quality={0.75} // Менша якість = менший розмір
/>
```

## Утиліти

Функції в `lib/image-compression.ts`:

```typescript
// Стиснути зображення програмно
const blob = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8
})

// Отримати розмір в MB
const sizeMB = getFileSizeMB(blob)

// Форматувати розмір для відображення
const sizeStr = formatFileSize(blob.size) // "1.2 MB"

// Перевірити, чи формат підтримується
const isSupported = isSupportedImageFormat(file)
```

## Підтримані формати

✅ PNG
✅ JPEG/JPG
✅ WebP
✅ GIF
✅ BMP
✅ TIFF
✅ SVG

## Параметри компресії

| Параметр | За замовчуванням | Опис |
|----------|-----------------|------|
| `maxWidth` | 1920 | Максимальна ширина в px |
| `maxHeight` | 1920 | Максимальна висота в px |
| `quality` | 0.8 | Якість WebP (0-1) |

## Економія місця

Типові результати для фото моделей телефонів:

- **Оригіnal PNG**: 8-12 MB
- **Стиснутий WebP**: 0.5-1.5 MB
- **Економія**: 85-95%

## Браузерна сумісність

WebP підтримується в:
- Chrome ✅
- Firefox ✅
- Safari 16+ ✅
- Edge ✅

## Примітки

- Компресія відбувається на клієнтській стороні, тому не навантажує сервер
- Всі операції виконуються синхронно до завантаження
- Користувач бачить прогрес компресії і завантаження
- Оригінальний файл не зберігається, тільки стиснута версія
