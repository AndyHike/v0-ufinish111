# Посібник з мультимовного імпорту даних

## Імпорт послуг з підтримкою кількох мов

Система підтримує імпорт послуг з перекладами на різні мови. Це дозволяє вам одночасно додавати або оновлювати послуги для всіх підтримуваних мов.

### Формат CSV-файлу

CSV-файл для імпорту послуг повинен містити наступні стовпці:

- `brand` - назва бренду (обов'язково)
- `model` - назва моделі (обов'язково)
- `service_uk` - назва послуги українською мовою (обов'язково)
- `description_uk` - опис послуги українською мовою (необов'язково)
- `service_en` - назва послуги англійською мовою (необов'язково)
- `description_en` - опис послуги англійською мовою (необов'язково)
- `service_cs` - назва послуги чеською мовою (необов'язково)
- `description_cs` - опис послуги чеською мовою (необов'язково)
- `price` - ціна послуги (обов'язково, може бути порожнім для "Ціна за запитом")

### Приклад CSV-файлу

\`\`\`csv
brand,model,service_uk,description_uk,service_en,description_en,service_cs,description_cs,price
Apple,iPhone 13,Заміна екрану,Професійна заміна розбитого або пошкодженого екрану,Screen Replacement,Professional replacement of broken or damaged screens,Výměna displeje,Profesionální výměna rozbitého nebo poškozeného displeje,2500
Samsung,Galaxy S21,Заміна батареї,Відновлення тривалості роботи вашого телефону з новою батареєю,Battery Replacement,Restore your phone's battery life with a new battery,Výměna baterie,Obnovení výdrže vašeho telefonu s novou baterií,1200
