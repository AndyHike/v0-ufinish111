import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Wrench, Clock, ArrowRight } from "lucide-react"

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Maintenance" })
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default function MaintenancePage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

      {/* Admin login button */}
      <div className="absolute top-6 right-6 z-10">
        <Link
          href={`/${locale}/auth/signin`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
        >
          Вхід для адміністраторів
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
              <Wrench className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">Технічні роботи</h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
            Ми працюємо над покращенням нашого сервісу.
            <br />
            Незабаром все буде готово!
          </p>

          {/* ETA */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 inline-block">
            <div className="flex items-center gap-3 text-white">
              <Clock className="h-6 w-6" />
              <span className="text-lg font-medium">Очікуваний час завершення:</span>
            </div>
            <div className="text-2xl font-bold text-white mt-2">Сьогодні о 18:00</div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto mb-8">
            <div className="bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-400 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: "75%" }}
              />
            </div>
            <p className="text-white/80 text-sm mt-2">Прогрес: 75%</p>
          </div>

          {/* Contact info */}
          <p className="text-slate-400 text-sm">
            Питання? Зв'яжіться з нами:
            <a href="mailto:support@example.com" className="text-white hover:underline ml-1">
              support@example.com
            </a>
          </p>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  )
}
