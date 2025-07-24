export function getVerificationEmailTemplate(verificationLink: string, locale: string): string {
  const translations = {
    en: {
      title: "Verify your email address",
      message: "Please click the link below to verify your email address:",
      buttonText: "Verify Email",
      footer: "If you didn't request this, please ignore this email.",
    },
    uk: {
      title: "Підтвердіть вашу електронну адресу",
      message: "Будь ласка, натисніть на посилання нижче, щоб підтвердити вашу електронну адресу:",
      buttonText: "Підтвердити Email",
      footer: "Якщо ви не запитували це, будь ласка, ігноруйте цей лист.",
    },
    cs: {
      title: "Ověřte svou e-mailovou adresu",
      message: "Klikněte prosím na odkaz níže pro ověření vaší e-mailové adresy:",
      buttonText: "Ověřit E-mail",
      footer: "Pokud jste o to nepožádali, ignorujte prosím tento e-mail.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .button { background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${t.title}</h2>
        <p>${t.message}</p>
        <a href="${verificationLink}" class="button">${t.buttonText}</a>
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getPasswordResetEmailTemplate(resetLink: string, locale: string): string {
  const translations = {
    en: {
      title: "Reset your password",
      message: "Please click the link below to reset your password:",
      buttonText: "Reset Password",
      footer: "If you didn't request this, please ignore this email.",
    },
    uk: {
      title: "Скидання вашого пароля",
      message: "Будь ласка, натисніть на посилання нижче, щоб скинути ваш пароль:",
      buttonText: "Скинути пароль",
      footer: "Якщо ви не запитували це, будь ласка, ігноруйте цей лист.",
    },
    cs: {
      title: "Obnovení hesla",
      message: "Klikněte prosím na odkaz níže pro obnovení vašeho hesla:",
      buttonText: "Obnovit heslo",
      footer: "Pokud jste o to nepožádali, ignorujte prosím tento e-mail.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .button { background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${t.title}</h2>
        <p>${t.message}</p>
        <a href="${resetLink}" class="button">${t.buttonText}</a>
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getVerificationCodeEmailTemplate(code: string, locale: string, isLogin = true): string {
  const translations = {
    en: {
      title: isLogin ? "Your login verification code" : "Your registration verification code",
      greeting: "Hello,",
      message: isLogin
        ? "Here is your verification code to complete your login:"
        : "Here is your verification code to complete your registration:",
      codeLabel: "Your verification code:",
      expiry: "This code will expire in 15 minutes.",
      footer: "If you didn't request this code, please ignore this email.",
    },
    uk: {
      title: isLogin ? "Ваш код підтвердження входу" : "Ваш код підтвердження реєстрації",
      greeting: "Вітаємо,",
      message: isLogin
        ? "Ось ваш код підтвердження для завершення входу:"
        : "Ось ваш код підтвердження для завершення реєстрації:",
      codeLabel: "Ваш код підтвердження:",
      expiry: "Цей код буде дійсним протягом 15 хвилин.",
      footer: "Якщо ви не запитували цей код, будь ласка, ігноруйте цей лист.",
    },
    cs: {
      title: isLogin ? "Váš ověřovací kód pro přihlášení" : "Váš ověřovací kód pro registraci",
      greeting: "Dobrý den,",
      message: isLogin
        ? "Zde je váš ověřovací kód pro dokončení přihlášení:"
        : "Zde je váš ověřovací kód pro dokončení registrace:",
      codeLabel: "Váš ověřovací kód:",
      expiry: "Tento kód vyprší za 15 minut.",
      footer: "Pokud jste o tento kód nežádali, ignorujte prosím tento e-mail.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .code-container { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: center; }
        .code { font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${t.title}</h2>
        <p>${t.greeting}</p>
        <p>${t.message}</p>
        <div class="code-container">
          <p>${t.codeLabel}</p>
          <p class="code">${code}</p>
        </div>
        <p>${t.expiry}</p>
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getNewContactMessageTemplate(
  contactMessage: {
    name: string
    email: string
    phone?: string | null
    message: string
  },
  locale: string,
): string {
  const translations = {
    en: {
      title: "New Contact Form Message",
      greeting: "Hello,",
      message: "You have received a new message from the contact form on your website.",
      details: "Message Details:",
      name: "Name:",
      email: "Email:",
      phone: "Phone:",
      messageLabel: "Message:",
      footer: "This is an automated notification.",
    },
    uk: {
      title: "Нове повідомлення з контактної форми",
      greeting: "Вітаємо,",
      message: "Ви отримали нове повідомлення з контактної форми на вашому сайті.",
      details: "Деталі повідомлення:",
      name: "Ім'я:",
      email: "Email:",
      phone: "Телефон:",
      messageLabel: "Повідомлення:",
      footer: "Це автоматичне сповіщення.",
    },
    cs: {
      title: "Nová zpráva z kontaktního formuláře",
      greeting: "Dobrý den,",
      message: "Obdrželi jste novou zprávu z kontaktního formuláře na vašem webu.",
      details: "Podrobnosti zprávy:",
      name: "Jméno:",
      email: "Email:",
      phone: "Telefon:",
      messageLabel: "Zpráva:",
      footer: "Toto je automatické oznámení.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .details { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .label { font-weight: bold; }
        .message-content { white-space: pre-wrap; margin-top: 5px; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${t.title}</h2>
        <p>${t.greeting}</p>
        <p>${t.message}</p>
        <div class="details">
          <p><span class="label">${t.name}</span> ${contactMessage.name}</p>
          <p><span class="label">${t.email}</span> ${contactMessage.email}</p>
          ${contactMessage.phone ? `<p><span class="label">${t.phone}</span> ${contactMessage.phone}</p>` : ""}
          <p><span class="label">${t.messageLabel}</span></p>
          <div class="message-content">${contactMessage.message}</div>
        </div>
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getBookingConfirmationTemplate(
  bookingData: {
    id: string
    serviceName: string
    brandName: string
    modelName: string
    bookingDate: string
    bookingTime: string
    customerName: string
    price: number | null
  },
  locale: string,
): string {
  const translations = {
    en: {
      title: "Booking Confirmation",
      greeting: "Dear",
      message: "Thank you for booking a service with DeviceHelp. Your booking has been confirmed.",
      details: "Booking Details:",
      bookingId: "Booking ID:",
      service: "Service:",
      device: "Device:",
      dateTime: "Date & Time:",
      price: "Price:",
      priceOnRequest: "Price on request",
      nextSteps: "What's next?",
      nextStepsText:
        "We will contact you before your appointment to confirm the details. Please bring your device and any relevant accessories.",
      contact: "If you have any questions, please contact us.",
      footer: "Thank you for choosing DeviceHelp!",
    },
    uk: {
      title: "Підтвердження бронювання",
      greeting: "Шановний(а)",
      message: "Дякуємо за бронювання послуги в DeviceHelp. Ваше бронювання підтверджено.",
      details: "Деталі бронювання:",
      bookingId: "ID бронювання:",
      service: "Послуга:",
      device: "Пристрій:",
      dateTime: "Дата і час:",
      price: "Ціна:",
      priceOnRequest: "Ціна за запитом",
      nextSteps: "Що далі?",
      nextStepsText:
        "Ми зв'яжемося з вами перед візитом для підтвердження деталей. Будь ласка, принесіть ваш пристрій та необхідні аксесуари.",
      contact: "Якщо у вас є питання, будь ласка, зв'яжіться з нами.",
      footer: "Дякуємо, що обрали DeviceHelp!",
    },
    cs: {
      title: "Potvrzení rezervace",
      greeting: "Vážený(á)",
      message: "Děkujeme za rezervaci služby u DeviceHelp. Vaše rezervace byla potvrzena.",
      details: "Podrobnosti rezervace:",
      bookingId: "ID rezervace:",
      service: "Služba:",
      device: "Zařízení:",
      dateTime: "Datum a čas:",
      price: "Cena:",
      priceOnRequest: "Cena na vyžádání",
      nextSteps: "Co dál?",
      nextStepsText:
        "Před vaší návštěvou vás budeme kontaktovat pro potvrzení detailů. Prosím přineste své zařízení a potřebné příslušenství.",
      contact: "Pokud máte jakékoli otázky, kontaktujte nás prosím.",
      footer: "Děkujeme, že jste si vybrali DeviceHelp!",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US")
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds
  }

  const formatPrice = (price: number | null) => {
    if (!price) return t.priceOnRequest
    return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
      style: "currency",
      currency: "CZK",
    }).format(price)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .details { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 120px; }
        .next-steps { margin: 20px 0; padding: 15px; background-color: #e0f2fe; border-radius: 5px; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${t.title}</h2>
        </div>
        <p>${t.greeting} ${bookingData.customerName},</p>
        <p>${t.message}</p>
        
        <div class="details">
          <h3>${t.details}</h3>
          <div class="detail-row">
            <span class="label">${t.bookingId}</span> ${bookingData.id}
          </div>
          <div class="detail-row">
            <span class="label">${t.service}</span> ${bookingData.serviceName}
          </div>
          <div class="detail-row">
            <span class="label">${t.device}</span> ${bookingData.brandName} ${bookingData.modelName}
          </div>
          <div class="detail-row">
            <span class="label">${t.dateTime}</span> ${formatDate(bookingData.bookingDate)} ${formatTime(bookingData.bookingTime)}
          </div>
          <div class="detail-row">
            <span class="label">${t.price}</span> ${formatPrice(bookingData.price)}
          </div>
        </div>

        <div class="next-steps">
          <h3>${t.nextSteps}</h3>
          <p>${t.nextStepsText}</p>
        </div>

        <p>${t.contact}</p>
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getNewBookingNotificationTemplate(
  bookingData: {
    id: string
    serviceName: string
    brandName: string
    modelName: string
    bookingDate: string
    bookingTime: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAddress?: string | null
    price: number | null
    notes?: string | null
  },
  locale: string,
): string {
  const translations = {
    en: {
      title: "New Service Booking",
      greeting: "Hello,",
      message: "You have received a new service booking.",
      details: "Booking Details:",
      bookingId: "Booking ID:",
      service: "Service:",
      device: "Device:",
      dateTime: "Date & Time:",
      price: "Price:",
      priceOnRequest: "Price on request",
      customer: "Customer Information:",
      name: "Name:",
      email: "Email:",
      phone: "Phone:",
      address: "Address:",
      notes: "Notes:",
      footer: "This is an automated notification.",
    },
    uk: {
      title: "Нове бронювання послуги",
      greeting: "Вітаємо,",
      message: "Ви отримали нове бронювання послуги.",
      details: "Деталі бронювання:",
      bookingId: "ID бронювання:",
      service: "Послуга:",
      device: "Пристрій:",
      dateTime: "Дата і час:",
      price: "Ціна:",
      priceOnRequest: "Ціна за запитом",
      customer: "Інформація про клієнта:",
      name: "Ім'я:",
      email: "Email:",
      phone: "Телефон:",
      address: "Адреса:",
      notes: "Примітки:",
      footer: "Це автоматичне сповіщення.",
    },
    cs: {
      title: "Nová rezervace služby",
      greeting: "Dobrý den,",
      message: "Obdrželi jste novou rezervaci služby.",
      details: "Podrobnosti rezervace:",
      bookingId: "ID rezervace:",
      service: "Služba:",
      device: "Zařízení:",
      dateTime: "Datum a čas:",
      price: "Cena:",
      priceOnRequest: "Cena na vyžádání",
      customer: "Informace o zákazníkovi:",
      name: "Jméno:",
      email: "Email:",
      phone: "Telefon:",
      address: "Adresa:",
      notes: "Poznámky:",
      footer: "Toto je automatické oznámení.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US")
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds
  }

  const formatPrice = (price: number | null) => {
    if (!price) return t.priceOnRequest
    return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
      style: "currency",
      currency: "CZK",
    }).format(price)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .details { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .customer-info { margin: 20px 0; padding: 15px; background-color: #e0f2fe; border-radius: 5px; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 120px; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${t.title}</h2>
        </div>
        <p>${t.greeting}</p>
        <p>${t.message}</p>
        
        <div class="details">
          <h3>${t.details}</h3>
          <div class="detail-row">
            <span class="label">${t.bookingId}</span> ${bookingData.id}
          </div>
          <div class="detail-row">
            <span class="label">${t.service}</span> ${bookingData.serviceName}
          </div>
          <div class="detail-row">
            <span class="label">${t.device}</span> ${bookingData.brandName} ${bookingData.modelName}
          </div>
          <div class="detail-row">
            <span class="label">${t.dateTime}</span> ${formatDate(bookingData.bookingDate)} ${formatTime(bookingData.bookingTime)}
          </div>
          <div class="detail-row">
            <span class="label">${t.price}</span> ${formatPrice(bookingData.price)}
          </div>
        </div>

        <div class="customer-info">
          <h3>${t.customer}</h3>
          <div class="detail-row">
            <span class="label">${t.name}</span> ${bookingData.customerName}
          </div>
          <div class="detail-row">
            <span class="label">${t.email}</span> ${bookingData.customerEmail}
          </div>
          <div class="detail-row">
            <span class="label">${t.phone}</span> ${bookingData.customerPhone}
          </div>
          ${
            bookingData.customerAddress
              ? `
          <div class="detail-row">
            <span class="label">${t.address}</span> ${bookingData.customerAddress}
          </div>
          `
              : ""
          }
          ${
            bookingData.notes
              ? `
          <div class="detail-row">
            <span class="label">${t.notes}</span> ${bookingData.notes}
          </div>
          `
              : ""
          }
        </div>

        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}
