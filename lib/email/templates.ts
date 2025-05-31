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
