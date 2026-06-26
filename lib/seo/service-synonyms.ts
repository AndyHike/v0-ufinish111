import { lowerFirst } from "./page-utils"

// Search phrases people actually type, per service slug per locale. {model} is
// replaced with the search-friendly model name (e.g. "iPhone 14"). Each list
// mixes action synonyms (oprava/výměna/servis), component synonyms
// (displej/LCD/sklo/obrazovka), symptoms ("nefunguje obrazovka", "nenabíjí se")
// and colloquial wording. This is the raw material for a crawlable
// "people also search" line + price FAQ on every service×model page, so the
// page ranks for the long tail beyond the literal service name.
//
// cs / uk are the primary markets; en is kept at equal depth.

export type SeoLocale = "cs" | "uk" | "en"

const SYNONYMS: Record<string, Record<SeoLocale, string[]>> = {
  "screen-glass-replacement": {
    cs: [
      "výměna skla displeje {model}",
      "oprava skla {model}",
      "prasklé sklo {model}",
      "rozbité sklo displeje",
      "popraskané sklo {model}",
      "výměna krycího skla",
      "displej funguje, ale sklo je prasklé",
      "lepení skla {model}",
    ],
    uk: [
      "заміна скла дисплея {model}",
      "ремонт скла {model}",
      "тріснуте скло {model}",
      "розбите скло екрана",
      "поміняти скло {model}",
      "дисплей працює, а скло тріснуло",
      "переклейка скла {model}",
    ],
    en: [
      "glass replacement {model}",
      "glass repair {model}",
      "cracked glass {model}",
      "broken display glass",
      "front glass replacement {model}",
      "display works but glass is cracked",
      "glass only replacement",
    ],
  },

  "screen-replacement": {
    cs: [
      "výměna displeje {model}",
      "oprava displeje {model}",
      "rozbitý displej {model}",
      "prasklý displej",
      "výměna LCD {model}",
      "rozbitá obrazovka {model}",
      "nefunguje obrazovka",
      "černý displej",
      "nefunkční dotyk",
      "pruhy na displeji",
    ],
    uk: [
      "заміна екрану {model}",
      "заміна дисплея {model}",
      "ремонт екрану {model}",
      "розбитий екран {model}",
      "тріснутий дисплей",
      "заміна LCD {model}",
      "не працює екран",
      "чорний екран",
      "не працює сенсор",
      "смуги на екрані",
    ],
    en: [
      "screen replacement {model}",
      "display repair {model}",
      "broken screen {model}",
      "cracked display",
      "LCD replacement {model}",
      "screen not working",
      "black screen",
      "touch not working",
      "lines on screen",
    ],
  },

  "screen-replacement-premium": {
    cs: [
      "levnější displej {model}",
      "neoriginální displej {model}",
      "kopie displeje {model}",
      "výměna displeje premium {model}",
      "oprava obrazovky {model}",
      "rozbitý displej {model}",
      "displej za rozumnou cenu",
      "náhradní displej {model}",
    ],
    uk: [
      "дешевший дисплей {model}",
      "неоригінальний екран {model}",
      "копія дисплея {model}",
      "заміна дисплея преміум {model}",
      "ремонт екрану {model}",
      "розбитий екран {model}",
      "екран за розумну ціну",
    ],
    en: [
      "cheaper screen {model}",
      "aftermarket display {model}",
      "copy screen {model}",
      "premium display replacement {model}",
      "broken screen {model}",
      "affordable screen replacement {model}",
    ],
  },

  "battery-replacement": {
    cs: [
      "výměna baterie {model}",
      "oprava baterie {model}",
      "nová baterie {model}",
      "výměna akumulátoru {model}",
      "baterie rychle padá",
      "rychle se vybíjí {model}",
      "telefon se sám vypíná",
      "slabá baterie {model}",
      "kondice baterie {model}",
    ],
    uk: [
      "заміна батареї {model}",
      "ремонт батареї {model}",
      "заміна акумулятора {model}",
      "нова батарея {model}",
      "батарея швидко сідає",
      "швидко розряджається {model}",
      "телефон сам вимикається",
      "слабка батарея {model}",
      "ємність акумулятора {model}",
    ],
    en: [
      "battery replacement {model}",
      "battery repair {model}",
      "new battery {model}",
      "replace battery {model}",
      "battery draining fast",
      "phone shuts off by itself",
      "weak battery {model}",
      "battery health {model}",
    ],
  },

  "charging-port-repair": {
    cs: [
      "oprava nabíjecího portu {model}",
      "výměna konektoru {model}",
      "nabíjecí konektor {model}",
      "napájecí konektor {model}",
      "telefon se nenabíjí {model}",
      "nenabíjí se {model}",
      "nedrží kabel",
      "vypadává nabíjení",
      "čištění portu {model}",
    ],
    uk: [
      "ремонт порту зарядки {model}",
      "заміна роз'єму зарядки {model}",
      "роз'єм заряджання {model}",
      "гніздо зарядки {model}",
      "не заряджається {model}",
      "погано тримає кабель",
      "пропадає зарядка",
      "повільно заряджається {model}",
      "чистка порту {model}",
    ],
    en: [
      "charging port repair {model}",
      "charging connector replacement {model}",
      "charging jack {model}",
      "not charging {model}",
      "loose cable",
      "charging drops out",
      "slow charging {model}",
      "charging port cleaning {model}",
    ],
  },

  "back-cover-replacement": {
    cs: [
      "výměna zadního krytu {model}",
      "oprava zadního skla {model}",
      "rozbité zadní sklo {model}",
      "prasklý zadní kryt",
      "výměna zadního panelu {model}",
      "zadní strana rozbitá",
      "kryt baterie {model}",
    ],
    uk: [
      "заміна задньої кришки {model}",
      "заміна заднього скла {model}",
      "розбите заднє скло {model}",
      "тріснута задня кришка",
      "ремонт задньої панелі {model}",
      "задня частина розбита",
      "поміняти задню кришку {model}",
    ],
    en: [
      "back cover replacement {model}",
      "back glass repair {model}",
      "broken back glass {model}",
      "cracked back cover",
      "rear panel replacement {model}",
      "back housing {model}",
    ],
  },

  "rear-camera-repair": {
    cs: [
      "oprava zadní kamery {model}",
      "výměna zadní kamery {model}",
      "rozmazaná kamera {model}",
      "kamera nefunguje {model}",
      "rozbitá zadní kamera",
      "skvrny na fotkách",
      "hlavní fotoaparát {model}",
      "kamera nezaostřuje",
    ],
    uk: [
      "ремонт задньої камери {model}",
      "заміна задньої камери {model}",
      "розмита камера {model}",
      "камера не працює {model}",
      "розбита задня камера",
      "плями на фото",
      "основна камера {model}",
      "камера не фокусує",
    ],
    en: [
      "rear camera repair {model}",
      "back camera replacement {model}",
      "blurry camera {model}",
      "camera not working {model}",
      "broken rear camera",
      "main camera {model}",
      "camera won't focus",
    ],
  },

  "front-camera-repair": {
    cs: [
      "oprava přední kamery {model}",
      "výměna přední kamery {model}",
      "selfie kamera nefunguje {model}",
      "rozmazaná přední kamera",
      "čelní kamera {model}",
      "přední foťák {model}",
      "kamera pro selfie",
    ],
    uk: [
      "ремонт передньої камери {model}",
      "заміна передньої камери {model}",
      "фронтальна камера не працює {model}",
      "розмита селфі камера",
      "передня камера {model}",
      "камера для селфі {model}",
    ],
    en: [
      "front camera repair {model}",
      "front camera replacement {model}",
      "selfie camera not working {model}",
      "blurry front camera",
      "facetime camera {model}",
    ],
  },

  "camera-glass-replacement": {
    cs: [
      "výměna skla kamery {model}",
      "prasklé sklo kamery {model}",
      "rozbité sklo fotoaparátu",
      "oprava krycího skla kamery {model}",
      "škrábance na skle kamery",
      "sklíčko kamery {model}",
    ],
    uk: [
      "заміна скла камери {model}",
      "тріснуте скло камери {model}",
      "розбите скло фотоапарата",
      "ремонт захисного скла камери {model}",
      "подряпини на склі камери",
      "скельце камери {model}",
    ],
    en: [
      "camera glass replacement {model}",
      "cracked camera glass {model}",
      "broken camera lens glass",
      "camera lens cover repair {model}",
      "scratched camera glass",
    ],
  },

  "ear-speaker-repair": {
    cs: [
      "oprava sluchátka {model}",
      "není slyšet volajícího {model}",
      "tichý sluchátkový reproduktor",
      "neslyším při hovoru {model}",
      "horní reproduktor {model}",
      "špatně slyším volajícího",
    ],
    uk: [
      "ремонт розмовного динаміка {model}",
      "не чути співрозмовника {model}",
      "тихий розмовний динамік",
      "не чую під час дзвінка {model}",
      "верхній динамік {model}",
      "погано чути при розмові",
    ],
    en: [
      "ear speaker repair {model}",
      "can't hear caller {model}",
      "quiet earpiece",
      "no sound during calls {model}",
      "earpiece speaker {model}",
    ],
  },

  "speaker-repair": {
    cs: [
      "oprava reproduktoru {model}",
      "není zvuk {model}",
      "tichý reproduktor",
      "chrastí reproduktor {model}",
      "špatný zvuk při přehrávání",
      "spodní reproduktor {model}",
      "reproduktor nehraje",
    ],
    uk: [
      "ремонт динаміка {model}",
      "немає звуку {model}",
      "тихий динамік",
      "хрипить динамік {model}",
      "поганий звук {model}",
      "нижній динамік {model}",
      "динамік не працює",
    ],
    en: [
      "speaker repair {model}",
      "no sound {model}",
      "quiet speaker",
      "crackling speaker {model}",
      "loudspeaker {model}",
      "speaker not working",
    ],
  },

  "microphone-repair": {
    cs: [
      "oprava mikrofonu {model}",
      "není mě slyšet {model}",
      "špatný mikrofon {model}",
      "nefunguje mikrofon při hovoru",
      "tichý mikrofon",
      "mikrofon nenahrává {model}",
      "spodní mikrofon {model}",
    ],
    uk: [
      "ремонт мікрофона {model}",
      "мене не чути {model}",
      "поганий мікрофон {model}",
      "не працює мікрофон при дзвінку",
      "тихий мікрофон",
      "мікрофон не записує {model}",
      "нижній мікрофон {model}",
    ],
    en: [
      "microphone repair {model}",
      "can't be heard on calls {model}",
      "bad microphone {model}",
      "mic not working on calls",
      "quiet microphone",
      "mic not recording {model}",
    ],
  },

  "water-damage-repair": {
    cs: [
      "oprava po vodě {model}",
      "telefon spadl do vody {model}",
      "vyplavený telefon",
      "tekutina v telefonu {model}",
      "polití telefonu {model}",
      "nezapne se po vodě {model}",
      "záchrana telefonu po vodě",
      "čištění po vodě",
    ],
    uk: [
      "ремонт після води {model}",
      "телефон впав у воду {model}",
      "залило телефон",
      "рідина в телефоні {model}",
      "потрапила вода {model}",
      "не вмикається після води {model}",
      "порятунок телефона після води",
      "чистка після води",
    ],
    en: [
      "water damage repair {model}",
      "phone dropped in water {model}",
      "liquid damage {model}",
      "wet phone repair",
      "phone won't turn on after water {model}",
      "water cleaning {model}",
    ],
  },
}

const ALSO_LABEL: Record<SeoLocale, string> = {
  cs: "Lidé tuto opravu hledají také jako",
  uk: "Цей ремонт також шукають як",
  en: "People also search for this repair as",
}

export function asSeoLocale(locale: string): SeoLocale {
  return locale === "uk" || locale === "en" ? locale : "cs"
}

// Crawlable "people also search" line for a service×model page. Returns null
// when the service has no dictionary entry (e.g. a newly added service).
export function buildAlsoSearched(slug: string, locale: SeoLocale, modelName: string): string | null {
  const phrases = SYNONYMS[slug]?.[locale]
  if (!phrases?.length) return null
  const rendered = phrases.map((p) => p.replace(/\{model\}/g, modelName).replace(/\s{2,}/g, " ").trim())
  return `${ALSO_LABEL[locale]}: ${rendered.join(", ")}.`
}

// Templated price/duration FAQ appended to each service×model page so it ranks
// for "kolik stojí / cena" and "jak dlouho" style queries in every language.
export function buildSynonymFaqs(
  locale: SeoLocale,
  serviceName: string,
  modelName: string,
  price: string | null,
): { question: string; answer: string }[] {
  // First letter lowercased for mid-sentence questions ("Kolik stojí výměna…"),
  // but answers lead with the full nominative name + " — cena od …" to avoid
  // Czech/Ukrainian case declension the template can't do.
  const svc = lowerFirst(serviceName)
  const name = serviceName

  if (locale === "uk") {
    return [
      {
        question: `Скільки коштує ${svc} ${modelName}?`,
        answer: price
          ? `${name} ${modelName} — ціна від ${price}. Ремонт триває приблизно 2–3 години, гарантія 6 місяців.`
          : `${name} ${modelName} — вартість залежить від моделі, напишіть нам і порахуємо за хвилину. Гарантія 6 місяців.`,
      },
      {
        question: `Скільки часу займає ${svc} ${modelName}?`,
        answer: `Зазвичай 2–3 години. Більшість ремонтів робимо при вас у Празі 6, Бржевнов, Bělohorská 209/133.`,
      },
    ]
  }
  if (locale === "en") {
    return [
      {
        // EN service names are Title Case in the DB, so keep them as-is (no lowerFirst).
        question: `How much does ${name} for ${modelName} cost?`,
        answer: price
          ? `${name} for ${modelName} starts from ${price}. The repair takes about 2–3 hours and comes with a 6-month warranty.`
          : `${name} for ${modelName} is priced per model — message us for a quick quote. 6-month warranty.`,
      },
      {
        question: `How long does ${name} for ${modelName} take?`,
        answer: `Usually 2–3 hours. Most repairs are done while you wait in Prague 6, Břevnov, Bělohorská 209/133.`,
      },
    ]
  }
  return [
    {
      question: `Kolik stojí ${svc} ${modelName}?`,
      answer: price
        ? `${name} ${modelName} — cena od ${price}. Oprava trvá přibližně 2–3 hodiny, záruka 6 měsíců.`
        : `${name} ${modelName} — cenu spočítáme obratem podle modelu. Záruka 6 měsíců.`,
    },
    {
      question: `Jak dlouho trvá ${svc} ${modelName}?`,
      answer: `Obvykle 2–3 hodiny. Většinu oprav stihneme na počkání v Praze 6 na Břevnově, Bělohorská 209/133.`,
    },
  ]
}
