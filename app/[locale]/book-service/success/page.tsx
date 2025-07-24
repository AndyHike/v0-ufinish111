import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircleIcon, CalendarIcon, ClockIcon } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: { locale: string }
  searchParams: { id?: string }
}

export default function BookingSuccessPage({ params, searchParams }: PageProps) {
  const bookingId = searchParams.id

  if (!bookingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">ID бронювання не знайдено</p>
            <div className="mt-4 text-center">
              <Link href={`/${params.locale}`}>
                <Button>Повернутися на головну</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Бронювання успішно створено!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-2">Ваш номер бронювання:</p>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {bookingId}
              </Badge>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Що далі?
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Ви отримаєте email з підтвердженням бронювання</li>
                <li>• Наш менеджер зв'яжеться з вами для підтвердження</li>
                <li>• Приходьте в призначений час з вашим пристроєм</li>
                <li>• Збережіть номер бронювання для зв'язку</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Важлива інформація
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Якщо потрібно перенести час, зв'яжіться з нами заздалегідь</li>
                <li>• Візьміть з собою документи на пристрій (якщо є)</li>
                <li>• Зробіть резервну копію важливих даних</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={`/${params.locale}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Повернутися на головну
                </Button>
              </Link>
              <Link href={`/${params.locale}/contact`} className="flex-1">
                <Button className="w-full">Зв'язатися з нами</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
