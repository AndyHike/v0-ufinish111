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

export function getBookingConfirmationEmailTemplate(
  bookingDetails: {
    customerName: string
    service: string
    device: string
    dateTime: string
    price: number | null
    notes?: string
  },
  locale: string,
): string {
  const translations = {
    en: {
      title: "Booking Confirmation",
      greeting: "Dear",
      message: "Thank you for booking a repair service with us. Your appointment has been confirmed.",
      details: "Appointment Details:",
      service: "Service:",
      device: "Device:",
      dateTime: "Date & Time:",
      price: "Price:",
      notes: "Notes:",
      priceOnRequest: "Price on request",
      nextSteps: "What's Next:",
      step1: "We will contact you 1 day before your appointment to confirm",
      step2: "Please bring your device and any accessories",
      step3: "If you need to reschedule, please contact us at least 24 hours in advance",
      contactInfo: "Contact Information:",
      phone: "Phone:",
      email: "Email:",
      address: "Address:",
      footer: "Thank you for choosing our repair service!",
    },
    uk: {
      title: "Підтвердження бронювання",
      greeting: "Шановний(а)",
      message: "Дякуємо за бронювання послуги ремонту у нас. Ваша зустріч підтверджена.",
      details: "Деталі зустрічі:",
      service: "Послуга:",
      device: "Пристрій:",
      dateTime: "Дата та час:",
      price: "Ціна:",
      notes: "Примітки:",
      priceOnRequest: "Ціна за запитом",
      nextSteps: "Що далі:",
      step1: "Ми зв'яжемося з вами за 1 день до зустрічі для підтвердження",
      step2: "Будь ласка, принесіть ваш пристрій та всі аксесуари",
      step3: "Якщо потрібно перенести зустріч, зв'яжіться з нами принаймні за 24 години",
      contactInfo: "Контактна інформація:",
      phone: "Телефон:",
      email: "Email:",
      address: "Адреса:",
      footer: "Дякуємо, що обрали наш сервіс ремонту!",
    },
    cs: {
      title: "Potvrzení rezervace",
      greeting: "Vážený(á)",
      message: "Děkujeme za rezervaci opravárenské služby u nás. Vaše schůzka byla potvrzena.",
      details: "Podrobnosti schůzky:",
      service: "Služba:",
      device: "Zařízení:",
      dateTime: "Datum a čas:",
      price: "Cena:",
      notes: "Poznámky:",
      priceOnRequest: "Cena na vyžádání",
      nextSteps: "Co dál:",
      step1: "Kontaktujeme vás 1 den před schůzkou pro potvrzení",
      step2: "Prosím přineste své zařízení a veškeré příslušenství",
      step3: "Pokud potřebujete přeložit schůzku, kontaktujte nás alespoň 24 hodin předem",
      contactInfo: "Kontaktní informace:",
      phone: "Telefon:",
      email: "Email:",
      address: "Adresa:",
      footer: "Děkujeme, že jste si vybrali náš opravárenský servis!",
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
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; margin: -20px -20px 20px -20px; }
        .details { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .label { font-weight: bold; color: #4F46E5; }
        .steps { margin: 20px 0; }
        .step { margin: 10px 0; padding: 10px; background-color: #e8f4fd; border-radius: 5px; }
        .contact-info { margin: 20px 0; padding: 15px; background-color: #f1f5f9; border-radius: 5px; }
        .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${t.title}</h2>
        </div>
        
        <p>${t.greeting} ${bookingDetails.customerName},</p>
        <p>${t.message}</p>
        
        <div class="details">
          <h3>${t.details}</h3>
          <p><span class="label">${t.service}</span> ${bookingDetails.service}</p>
          <p><span class="label">${t.device}</span> ${bookingDetails.device}</p>
          <p><span class="label">${t.dateTime}</span> ${bookingDetails.dateTime}</p>
          <p><span class="label">${t.price}</span> ${bookingDetails.price ? `${bookingDetails.price} Kč` : t.priceOnRequest}</p>
          ${bookingDetails.notes ? `<p><span class="label">${t.notes}</span> ${bookingDetails.notes}</p>` : ""}
        </div>
        
        <div class="steps">
          <h3>${t.nextSteps}</h3>
          <div class="step">1. ${t.step1}</div>
          <div class="step">2. ${t.step2}</div>
          <div class="step">3. ${t.step3}</div>
        </div>
        
        <div class="contact-info">
          <h3>${t.contactInfo}</h3>
          <p><span class="label">${t.phone}</span> +420 123 456 789</p>
          <p><span class="label">${t.email}</span> info@devicehelp.cz</p>
          <p><span class="label">${t.address}</span> Bělohorská 209/133, 169 00 Praha 6-Břevnov</p>
        </div>
        
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}

export function getNewBookingNotificationTemplate(
  bookingData: {
    service: any
    appointment: any
    customer: any
  },
  locale: string,
): string {
  const translations = {
    en: {
      title: "New Service Booking Received",
      greeting: "Hello,",
      message: "A new service booking has been received through your website.",
      customerDetails: "Customer Details:",
      name: "Name:",
      email: "Email:",
      phone: "Phone:",
      address: "Address:",
      serviceDetails: "Service Details:",
      service: "Service:",
      device: "Device:",
      dateTime: "Requested Date & Time:",
      price: "Price:",
      notes: "Customer Notes:",
      priceOnRequest: "Price on request",
      action: "Please contact the customer to confirm the appointment.",
      footer: "This is an automated notification from your booking system.",
    },
    uk: {
      title: "Отримано нове бронювання послуги",
      greeting: "Вітаємо,",
      message: "Через ваш веб-сайт отримано нове бронювання послуги.",
      customerDetails: "Деталі клієнта:",
      name: "Ім'я:",
      email: "Email:",
      phone: "Телефон:",
      address: "Адреса:",
      serviceDetails: "Деталі послуги:",
      service: "Послуга:",
      device: "Пристрій:",
      dateTime: "Запитувані дата та час:",
      price: "Ціна:",
      notes: "Примітки клієнта:",
      priceOnRequest: "Ціна за запитом",
      action: "Будь ласка, зв'яжіться з клієнтом для підтвердження зустрічі.",
      footer: "Це автоматичне сповіщення з вашої системи бронювання.",
    },
    cs: {
      title: "Přijata nová rezervace služby",
      greeting: "Dobrý den,",
      message: "Prostřednictvím vašeho webu byla přijata nová rezervace služby.",
      customerDetails: "Údaje zákazníka:",
      name: "Jméno:",
      email: "Email:",
      phone: "Telefon:",
      address: "Adresa:",
      serviceDetails: "Podrobnosti služby:",
      service: "Služba:",
      device: "Zařízení:",
      dateTime: "Požadované datum a čas:",
      price: "Cena:",
      notes: "Poznámky zákazníka:",
      priceOnRequest: "Cena na vyžádání",
      action: "Prosím kontaktujte zákazníka pro potvrzení schůzky.",
      footer: "Toto je automatické oznámení z vašeho rezervačního systému.",
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
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; margin: -20px -20px 20px -20px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #dc2626; }
        .label { font-weight: bold; color: #dc2626; }
        .action { margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 5px; border: 1px solid #fecaca; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${t.title}</h2>
        </div>
        
        <p>${t.greeting}</p>
        <p>${t.message}</p>
        
        <div class="section">
          <h3>${t.customerDetails}</h3>
          <p><span class="label">${t.name}</span> ${bookingData.customer.firstName} ${bookingData.customer.lastName}</p>
          <p><span class="label">${t.email}</span> ${bookingData.customer.email}</p>
          <p><span class="label">${t.phone}</span> ${bookingData.customer.phone}</p>
          ${bookingData.customer.address ? `<p><span class="label">${t.address}</span> ${bookingData.customer.address}</p>` : ""}
        </div>
        
        <div class="section">
          <h3>${t.serviceDetails}</h3>
          <p><span class="label">${t.service}</span> ${bookingData.service.name}</p>
          <p><span class="label">${t.device}</span> ${bookingData.service.brand} ${bookingData.service.model}</p>
          <p><span class="label">${t.dateTime}</span> ${bookingData.appointment.dateTime}</p>
          <p><span class="label">${t.price}</span> ${bookingData.service.price ? `${bookingData.service.price} Kč` : t.priceOnRequest}</p>
          ${bookingData.customer.notes ? `<p><span class="label">${t.notes}</span> ${bookingData.customer.notes}</p>` : ""}
        </div>
        
        <div class="action">
          <strong>${t.action}</strong>
        </div>
        
        <p class="footer">${t.footer}</p>
      </div>
    </body>
    </html>
  `
}
