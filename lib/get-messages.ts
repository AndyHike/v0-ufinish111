export async function getMessages(locale: string) {
  try {
    // Try to import the messages from the JSON files
    // return (await import(`../messages/${locale}.json`)).default
    switch (locale) {
      case "cs":
        return (await import("../messages/cs.json")).default
      case "en":
        return (await import("../messages/en.json")).default
      case "uk":
      default:
        return (await import("../messages/uk.json")).default
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)

    // Fallback to hardcoded messages if JSON import fails
    return {
      Admin: {
        modelServices: "Послуги для {model}",
        modelServicesDescription: "Керування послугами та цінами для {model} від {brand}",
        backToModels: "Назад до моделей",
        manageModelServices: "Керувати послугами моделі",
        addService: "Додати послугу",
        noServicesForModel: "Для цієї моделі ще не додано жодної послуги.",
        serviceName: "Назва послуги",
        serviceDescription: "Опис",
        price: "Ціна",
        actions: "Дії",
        edit: "Редагувати",
        delete: "Видалити",
        loading: "Завантаження...",
        priceOnRequest: "Ціна за запитом",
      },
      Header: {
        siteTitle: locale === "uk" ? "Ремонт Телефонів" : locale === "cs" ? "Oprava Telefonů" : "Phone Repair",
        home: locale === "uk" ? "Головна" : locale === "cs" ? "Domů" : "Home",
        services: locale === "uk" ? "Послуги" : locale === "cs" ? "Služby" : "Services",
        pricing: locale === "uk" ? "Ціни" : locale === "cs" ? "Ceník" : "Pricing",
        about: locale === "uk" ? "Про нас" : locale === "cs" ? "O nás" : "About",
        contact: locale === "uk" ? "Контакти" : locale === "cs" ? "Kontakt" : "Contact",
        openMenu: locale === "uk" ? "Відкрити меню" : locale === "cs" ? "Otevřít menu" : "Open menu",
        search: locale === "uk" ? "Пошук" : locale === "cs" ? "Hledat" : "Search",
      },
      Footer: {
        siteTitle: locale === "uk" ? "Ремонт Телефонів" : locale === "cs" ? "Oprava Telefonů" : "Phone Repair",
        description:
          locale === "uk"
            ? "Професійний ремонт мобільних телефонів з гарантією якості."
            : locale === "cs"
              ? "Profesionální oprava mobilních telefonů s garancí kvality."
              : "Professional mobile phone repair with quality guarantee.",
        quickLinks: locale === "uk" ? "Швидкі посилання" : locale === "cs" ? "Rychlé odkazy" : "Quick Links",
        home: locale === "uk" ? "Головна" : locale === "cs" ? "Domů" : "Home",
        services: locale === "uk" ? "Послуги" : locale === "cs" ? "Služby" : "Services",
        pricing: locale === "uk" ? "Ціни" : locale === "cs" ? "Ceník" : "Pricing",
        about: locale === "uk" ? "Про нас" : locale === "cs" ? "O nás" : "About",
        contact: locale === "uk" ? "Контакти" : locale === "cs" ? "Kontakt" : "Contact",
        contactUs: locale === "uk" ? "Зв'яжіться з нами" : locale === "cs" ? "Kontaktujte nás" : "Contact Us",
        address:
          locale === "uk"
            ? "вул. Хрещатик 1, Київ, Україна"
            : locale === "cs"
              ? "Václavské náměstí 1, Praha, Česká republika"
              : "Main Street 1, Kyiv, Ukraine",
        followUs: locale === "uk" ? "Слідкуйте за нами" : locale === "cs" ? "Sledujte nás" : "Follow Us",
        allRightsReserved:
          locale === "uk"
            ? "Всі права захищені."
            : locale === "cs"
              ? "Všechna práva vyhrazena."
              : "All rights reserved.",
      },
      UserNav: {
        login: locale === "uk" ? "Увійти" : locale === "cs" ? "Přihlásit se" : "Login",
        profile: locale === "uk" ? "Профіль" : locale === "cs" ? "Profil" : "Profile",
        orders: locale === "uk" ? "Замовлення" : locale === "cs" ? "Objednávky" : "Orders",
        adminDashboard:
          locale === "uk" ? "Панель адміністратора" : locale === "cs" ? "Administrátorský panel" : "Admin Dashboard",
        logout: locale === "uk" ? "Вийти" : locale === "cs" ? "Odhlásit se" : "Logout",
      },
      Search: {
        title: locale === "uk" ? "Пошук" : locale === "cs" ? "Hledat" : "Search",
        placeholder:
          locale === "uk"
            ? "Пошук телефонів, брендів..."
            : locale === "cs"
              ? "Hledat telefony, značky..."
              : "Search phones, brands...",
        search: locale === "uk" ? "Шукати" : locale === "cs" ? "Hledat" : "Search",
        clear: locale === "uk" ? "Очистити" : locale === "cs" ? "Vymazat" : "Clear",
        results: locale === "uk" ? "Результати" : locale === "cs" ? "Výsledky" : "Results",
        brand: locale === "uk" ? "Бренд" : locale === "cs" ? "Značka" : "Brand",
        model: locale === "uk" ? "Модель" : locale === "cs" ? "Model" : "Model",
        service: locale === "uk" ? "Послуга" : locale === "cs" ? "Služba" : "Service",
      },
      Hero: {
        title:
          locale === "uk"
            ? "Професійний ремонт мобільних телефонів"
            : locale === "cs"
              ? "Profesionální oprava mobilních telefonů"
              : "Professional Mobile Phone Repair",
        subtitle:
          locale === "uk"
            ? "Швидкий та якісний ремонт вашого телефону з гарантією. Довірте свій пристрій професіоналам."
            : locale === "cs"
              ? "Rychlá a kvalitní oprava vašeho telefonu s garancí. Svěřte svůj přístroj profesionálům."
              : "Fast and quality repair of your phone with warranty. Trust your device to professionals.",
        servicesButton: locale === "uk" ? "Наші послуги" : locale === "cs" ? "Naše služby" : "Our Services",
        contactButton: locale === "uk" ? "Зв'язатися" : locale === "cs" ? "Kontaktovat" : "Contact Us",
        feature1:
          locale === "uk" ? "Безкоштовна діагностика" : locale === "cs" ? "Bezplatná diagnostika" : "Free Diagnostics",
        feature2:
          locale === "uk"
            ? "Гарантія на всі ремонти"
            : locale === "cs"
              ? "Záruka na všechny opravy"
              : "Warranty on All Repairs",
        feature3:
          locale === "uk"
            ? "Швидкий ремонт протягом дня"
            : locale === "cs"
              ? "Rychlá oprava během dne"
              : "Same-Day Repair Service",
        imageAlt: locale === "uk" ? "Ремонт телефону" : locale === "cs" ? "Oprava telefonu" : "Phone Repair",
      },
      Services: {
        title: locale === "uk" ? "Наші послуги" : locale === "cs" ? "Naše služby" : "Our Services",
        subtitle:
          locale === "uk"
            ? "Ми пропонуємо широкий спектр послуг з ремонту мобільних телефонів."
            : locale === "cs"
              ? "Nabízíme širokou škálu služeb oprav mobilních telefonů."
              : "We offer a wide range of mobile phone repair services.",
        service1: {
          title: locale === "uk" ? "Заміна екрану" : locale === "cs" ? "Výměna displeje" : "Screen Replacement",
          description:
            locale === "uk"
              ? "Професійна заміна розбитого або пошкодженого екрану."
              : locale === "cs"
                ? "Profesionální výměna rozbitého nebo poškozeného displeje."
                : "Professional replacement of broken or damaged screens.",
        },
        service2: {
          title: locale === "uk" ? "Заміна батареї" : locale === "cs" ? "Výměna baterie" : "Battery Replacement",
          description:
            locale === "uk"
              ? "Відновлення тривалості роботи вашого телефону з новою батареєю."
              : locale === "cs"
                ? "Obnovení výdrže vašeho telefonu s novou baterií."
                : "Restore your phone's battery life with a new battery.",
        },
        service3: {
          title:
            locale === "uk"
              ? "Проблеми з підключенням"
              : locale === "cs"
                ? "Problémy s připojením"
                : "Connectivity Issues",
          description:
            locale === "uk"
              ? "Ремонт Wi-Fi, Bluetooth та інших проблем з підключенням."
              : locale === "cs"
                ? "Oprava Wi-Fi, Bluetooth a dalších problémů s připojením."
                : "Fix Wi-Fi, Bluetooth, and other connectivity issues.",
        },
        service4: {
          title: locale === "uk" ? "Захист від води" : locale === "cs" ? "Ochrana proti vodě" : "Water Damage",
          description:
            locale === "uk"
              ? "Відновлення телефонів після пошкодження водою."
              : locale === "cs"
                ? "Obnova telefonů po poškození vodou."
                : "Restore phones after water damage.",
        },
        learnMore: locale === "uk" ? "Дізнатися більше" : locale === "cs" ? "Zjistit více" : "Learn More",
        allServicesButton: locale === "uk" ? "Всі послуги" : locale === "cs" ? "Všechny služby" : "All Services",
      },
      Brands: {
        title:
          locale === "uk"
            ? "Бренди, з якими ми працюємо"
            : locale === "cs"
              ? "Značky, se kterými pracujeme"
              : "Brands We Work With",
        subtitle:
          locale === "uk"
            ? "Ми ремонтуємо телефони всіх популярних брендів."
            : locale === "cs"
              ? "Opravujeme telefony všech populárních značek."
              : "We repair phones of all popular brands.",
        allBrandsButton: locale === "uk" ? "Всі бренди" : locale === "cs" ? "Všechny značky" : "All Brands",
      },
      Testimonials: {
        title: locale === "uk" ? "Відгуки клієнтів" : locale === "cs" ? "Recenze zákazníků" : "Customer Testimonials",
        subtitle:
          locale === "uk"
            ? "Дізнайтеся, що кажуть наші клієнти про наші послуги."
            : locale === "cs"
              ? "Zjistěte, co říkají naši zákazníci o našich službách."
              : "See what our customers say about our services.",
        testimonial1: {
          name: locale === "uk" ? "Олександр Петренко" : locale === "cs" ? "Jan Novák" : "Alex Peterson",
          content:
            locale === "uk"
              ? "Дуже задоволений якістю ремонту. Мій iPhone працює як новий після заміни екрану."
              : locale === "cs"
                ? "Velmi spokojen s kvalitou opravy. Můj iPhone funguje jako nový po výměně displeje."
                : "Very satisfied with the quality of repair. My iPhone works like new after screen replacement.",
        },
        testimonial2: {
          name: locale === "uk" ? "Марія Коваленко" : locale === "cs" ? "Marie Svobodová" : "Maria Johnson",
          content:
            locale === "uk"
              ? "Швидкий та професійний сервіс. Замінили батарею за 30 хвилин, і тепер мій телефон тримає заряд цілий день."
              : locale === "cs"
                ? "Rychlý a profesionální servis. Vyměnili baterii za 30 minut a teď můj telefon vydrží celý den."
                : "Fast and professional service. They replaced the battery in 30 minutes, and now my phone lasts all day.",
        },
        testimonial3: {
          name: locale === "uk" ? "Іван Сидоренко" : locale === "cs" ? "Petr Dvořák" : "John Smith",
          content:
            locale === "uk"
              ? "Відмінний сервіс за розумною ціною. Рекомендую всім, хто має проблеми з телефоном."
              : locale === "cs"
                ? "Vynikající služby za rozumnou cenu. Doporučuji všem, kteří mají problémy s telefonem."
                : "Excellent service at a reasonable price. I recommend to anyone having phone issues.",
        },
        testimonial4: {
          name: locale === "uk" ? "Наталія Шевченко" : locale === "cs" ? "Lucie Nováková" : "Natalie Brown",
          content:
            locale === "uk"
              ? "Врятували мій телефон після того, як я впустила його у воду. Дуже вдячна за швидку допомогу!"
              : locale === "cs"
                ? "Zachránili můj telefon poté, co jsem ho upustila do vody. Velmi vděčná za rychlou pomoc!"
                : "They saved my phone after I dropped it in water. Very grateful for the quick help!",
        },
      },
      Contact: {
        title: locale === "uk" ? "Зв'яжіться з нами" : locale === "cs" ? "Kontaktujte nás" : "Contact Us",
        subtitle:
          locale === "uk"
            ? "Маєте питання? Напишіть нам, і ми зв'яжемося з вами якнайшвидше."
            : locale === "cs"
              ? "Máte otázky? Napište nám a my vás budeme kontaktovat co nejdříve."
              : "Have questions? Write to us and we will contact you as soon as possible.",
        phone: locale === "uk" ? "Телефон" : locale === "cs" ? "Telefon" : "Phone",
        email: locale === "uk" ? "Електронна пошта" : locale === "cs" ? "E-mail" : "Email",
        address: locale === "uk" ? "Адреса" : locale === "cs" ? "Adresa" : "Address",
        addressDetails:
          locale === "uk"
            ? "вул. Хрещатик 1, Київ, Україна"
            : locale === "cs"
              ? "Václavské náměstí 1, Praha, Česká republika"
              : "Main Street 1, Kyiv, Ukraine",
        mapTitle: locale === "uk" ? "Карта розташування" : locale === "cs" ? "Mapa umístění" : "Location Map",
        nameLabel: locale === "uk" ? "Ім'я" : locale === "cs" ? "Jméno" : "Name",
        namePlaceholder:
          locale === "uk" ? "Введіть ваше ім'я" : locale === "cs" ? "Zadejte své jméno" : "Enter your name",
        emailLabel: locale === "uk" ? "Електронна пошта" : locale === "cs" ? "E-mail" : "Email",
        emailPlaceholder:
          locale === "uk"
            ? "Введіть вашу електронну пошту"
            : locale === "cs"
              ? "Zadejte svůj e-mail"
              : "Enter your email",
        phoneLabel: locale === "uk" ? "Телефон" : locale === "cs" ? "Telefon" : "Phone",
        phonePlaceholder:
          locale === "uk"
            ? "Введіть ваш номер телефону"
            : locale === "cs"
              ? "Zadejte své telefonní číslo"
              : "Enter your phone number",
        messageLabel: locale === "uk" ? "Повідомлення" : locale === "cs" ? "Zpráva" : "Message",
        messagePlaceholder:
          locale === "uk"
            ? "Введіть ваше повідомлення"
            : locale === "cs"
              ? "Zadejte svou zprávu"
              : "Enter your message",
        send: locale === "uk" ? "Надіслати" : locale === "cs" ? "Odeslat" : "Send",
        sending: locale === "uk" ? "Надсилання..." : locale === "cs" ? "Odesílání..." : "Sending...",
        successTitle: locale === "uk" ? "Повідомлення надіслано" : locale === "cs" ? "Zpráva odeslána" : "Message Sent",
        successMessage:
          locale === "uk"
            ? "Дякуємо за ваше повідомлення. Ми зв'яжемося з вами якнайшвидше."
            : locale === "cs"
              ? "Děkujeme za vaši zprávu. Budeme vás kontaktovat co nejdříve."
              : "Thank you for your message. We will contact you as soon as possible.",
      },
    }
  }
}
