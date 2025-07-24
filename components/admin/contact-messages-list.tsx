"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { uk, cs, enUS } from "date-fns/locale"
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertTriangle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  created_at: string
  updated_at: string
}

interface ContactMessagesListProps {
  locale: string
}

export function ContactMessagesList({ locale }: ContactMessagesListProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateLocale = locale === "uk" ? uk : locale === "cs" ? cs : enUS

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    read: "bg-green-500",
    replied: "bg-purple-500",
    archived: "bg-gray-500",
  }

  const statusIcons: Record<string, React.ReactNode> = {
    new: <AlertCircle className="h-4 w-4" />,
    read: <CheckCircle className="h-4 w-4" />,
    replied: <MessageSquare className="h-4 w-4" />,
    archived: <Archive className="h-4 w-4" />,
  }

  const statusTranslations: Record<string, Record<string, string>> = {
    uk: {
      new: "Нове",
      read: "Прочитано",
      replied: "Відповідь надіслана",
      archived: "Архівовано",
    },
    cs: {
      new: "Nové",
      read: "Přečteno",
      replied: "Odpovězeno",
      archived: "Archivováno",
    },
    en: {
      new: "New",
      read: "Read",
      replied: "Replied",
      archived: "Archived",
    },
  }

  const filterTranslations: Record<string, Record<string, string>> = {
    uk: {
      all: "Всі повідомлення",
      new: "Нові",
      read: "Прочитані",
      replied: "З відповіддю",
      archived: "Архівовані",
    },
    cs: {
      all: "Všechny zprávy",
      new: "Nové",
      read: "Přečtené",
      replied: "Odpovězené",
      archived: "Archivované",
    },
    en: {
      all: "All messages",
      new: "New",
      read: "Read",
      replied: "Replied",
      archived: "Archived",
    },
  }

  const translations: Record<string, Record<string, string>> = {
    uk: {
      title: "Повідомлення з контактної форми",
      name: "Ім'я",
      email: "Email",
      message: "Повідомлення",
      status: "Статус",
      date: "Дата",
      actions: "Дії",
      view: "Переглянути",
      noMessages: "Повідомлень не знайдено",
      messageDetails: "Деталі повідомлення",
      phone: "Телефон",
      changeStatus: "Змінити статус",
      close: "Закрити",
      save: "Зберегти",
      prev: "Попередня",
      next: "Наступна",
      page: "Сторінка",
      of: "з",
      search: "Пошук",
      refresh: "Оновити",
      filter: "Фільтр",
      searchPlaceholder: "Пошук за ім'ям або email",
      allMessages: "Всі повідомлення",
      newMessages: "Нові повідомлення",
      readMessages: "Прочитані",
      repliedMessages: "З відповіддю",
      archivedMessages: "Архівовані",
      noResults: "Немає результатів для вашого пошуку",
      from: "Від",
      contactInfo: "Контактна інформація",
      messageContent: "Текст повідомлення",
      receivedTime: "Отримано",
      lastUpdated: "Останнє оновлення",
      unauthorized: "Немає доступу. Будь ласка, увійдіть як адміністратор.",
      loginAgain: "Увійти знову",
      errorLoading: "Помилка завантаження повідомле��ь",
      tryAgain: "Спробувати знову",
    },
    cs: {
      title: "Zprávy z kontaktního formuláře",
      name: "Jméno",
      email: "Email",
      message: "Zpráva",
      status: "Stav",
      date: "Datum",
      actions: "Akce",
      view: "Zobrazit",
      noMessages: "Žádné zprávy nenalezeny",
      messageDetails: "Detaily zprávy",
      phone: "Telefon",
      changeStatus: "Změnit stav",
      close: "Zavřít",
      save: "Uložit",
      prev: "Předchozí",
      next: "Další",
      page: "Stránka",
      of: "z",
      search: "Hledat",
      refresh: "Obnovit",
      filter: "Filtr",
      searchPlaceholder: "Hledat podle jména nebo emailu",
      allMessages: "Všechny zprávy",
      newMessages: "Nové zprávy",
      readMessages: "Přečtené",
      repliedMessages: "Odpovězené",
      archivedMessages: "Archivované",
      noResults: "Žádné výsledky pro vaše vyhledávání",
      from: "Od",
      contactInfo: "Kontaktní informace",
      messageContent: "Text zprávy",
      receivedTime: "Přijato",
      lastUpdated: "Poslední aktualizace",
      unauthorized: "Nemáte přístup. Přihlaste se prosím jako administrátor.",
      loginAgain: "Přihlásit se znovu",
      errorLoading: "Chyba při načítání zpráv",
      tryAgain: "Zkusit znovu",
    },
    en: {
      title: "Contact Form Messages",
      name: "Name",
      email: "Email",
      message: "Message",
      status: "Status",
      date: "Date",
      actions: "Actions",
      view: "View",
      noMessages: "No messages found",
      messageDetails: "Message Details",
      phone: "Phone",
      changeStatus: "Change Status",
      close: "Close",
      save: "Save",
      prev: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      search: "Search",
      refresh: "Refresh",
      filter: "Filter",
      searchPlaceholder: "Search by name or email",
      allMessages: "All Messages",
      newMessages: "New Messages",
      readMessages: "Read",
      repliedMessages: "Replied",
      archivedMessages: "Archived",
      noResults: "No results for your search",
      from: "From",
      contactInfo: "Contact Information",
      messageContent: "Message Content",
      receivedTime: "Received",
      lastUpdated: "Last Updated",
      unauthorized: "Unauthorized. Please login as administrator.",
      loginAgain: "Login Again",
      errorLoading: "Error loading messages",
      tryAgain: "Try Again",
    },
  }

  const t = translations[locale] || translations.en
  const statusT = statusTranslations[locale] || statusTranslations.en
  const filterT = filterTranslations[locale] || filterTranslations.en

  const fetchMessages = async () => {
    setLoading(true)
    setError(null)
    try {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : ""
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      const url = `/api/admin/contact-messages?page=${page}${statusParam}${searchParam}`
      console.log("Fetching messages from:", url)

      const response = await fetch(url)

      if (response.status === 401) {
        setError("unauthorized")
        setMessages([])
        setTotalPages(0)
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", response.status, errorText)
        throw new Error(`Failed to fetch messages: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("Received messages data:", data)

      if (Array.isArray(data.data)) {
        setMessages(data.data)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error("Unexpected data format:", data)
        setMessages([])
        setTotalPages(0)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError("errorLoading")
      setMessages([])
      setTotalPages(0)
      toast({
        title: t.errorLoading,
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message)
    setIsDialogOpen(true)

    // Якщо повідомлення нове, автоматично змінюємо статус на "прочитане"
    if (message.status === "new") {
      await updateMessageStatus(message.id, "read")
    }
  }

  const updateMessageStatus = async (id: string, status: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.status === 401) {
        setError("unauthorized")
        toast({
          title: t.unauthorized,
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", response.status, errorText)
        throw new Error(`Failed to update message status: ${response.status} ${errorText}`)
      }

      // Оновлюємо список повідомлень
      fetchMessages()

      // Якщо це вибране повідомлення, оновлюємо його статус
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({
          ...selectedMessage,
          status,
        })
      }

      toast({
        title: "Status updated",
        description: `Message status changed to ${status}`,
      })
    } catch (error) {
      console.error("Error updating message status:", error)
      toast({
        title: "Error updating status",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusChange = (status: string) => {
    if (selectedMessage) {
      updateMessageStatus(selectedMessage.id, status)
    }
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1) // Скидаємо сторінку при зміні фільтра
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Скидаємо сторінку при новому пошуку
    fetchMessages()
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchMessages()
  }

  const handleLoginAgain = () => {
    router.push("/auth/login")
  }

  useEffect(() => {
    fetchMessages()
  }, [page, statusFilter])

  // Відображення помилки авторизації
  if (error === "unauthorized") {
    return (
      <Card className="shadow-md">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.unauthorized}</h3>
          <p className="text-gray-500 mb-4 text-center">You need administrator privileges to access this page.</p>
          <Button onClick={handleLoginAgain}>{t.loginAgain}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{t.title}</CardTitle>
            <CardDescription>{filterT[statusFilter] || filterT.all}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t.searchPlaceholder}
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">{t.search}</span>
              </Button>
            </form>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">{t.refresh}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="mb-6" onValueChange={handleFilterChange}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">
              <Inbox className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.allMessages}</span>
            </TabsTrigger>
            <TabsTrigger value="new">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.newMessages}</span>
            </TabsTrigger>
            <TabsTrigger value="read">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.readMessages}</span>
            </TabsTrigger>
            <TabsTrigger value="replied">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.repliedMessages}</span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.archivedMessages}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : error === "errorLoading" ? (
          <div className="text-center py-12 border rounded-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t.errorLoading}</h3>
            <p className="text-gray-500 mb-4">An error occurred while loading messages.</p>
            <Button onClick={handleRefresh}>{t.tryAgain}</Button>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${message.status === "new" ? "border-blue-300 bg-blue-50 hover:bg-blue-100" : ""}`}
                onClick={() => handleViewMessage(message)}
              >
                <div className="flex items-center space-x-4 mb-2 md:mb-0">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${statusColors[message.status]} text-white`}
                  >
                    {message.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{message.name}</div>
                    <div className="text-sm text-gray-500">{message.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={`${statusColors[message.status]} text-white flex items-center gap-1`}>
                    {statusIcons[message.status]}
                    {statusT[message.status] || message.status}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </div>
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    {t.view}
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t.prev}
              </Button>
              <div className="text-sm">
                {t.page} {page} {t.of} {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= totalPages}>
                {t.next}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-md">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{searchTerm ? t.noResults : t.noMessages}</h3>
            <p className="text-gray-500">{searchTerm ? `${t.noResults}` : `${t.noMessages}`}</p>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {selectedMessage && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{t.messageDetails}</span>
                  <Badge className={`${statusColors[selectedMessage.status]} text-white ml-2 flex items-center gap-1`}>
                    {statusIcons[selectedMessage.status]}
                    {statusT[selectedMessage.status] || selectedMessage.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {t.from}: <strong>{selectedMessage.name}</strong> -{" "}
                  {formatDistanceToNow(new Date(selectedMessage.created_at), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t.contactInfo}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedMessage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t.messageContent}</h4>
                  <div className="bg-white border p-4 rounded-md whitespace-pre-wrap">{selectedMessage.message}</div>
                </div>

                <div className="flex flex-col space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {t.receivedTime}: {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {t.lastUpdated}: {new Date(selectedMessage.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t.changeStatus}</h4>
                  <Select value={selectedMessage.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{statusT.new}</SelectItem>
                      <SelectItem value="read">{statusT.read}</SelectItem>
                      <SelectItem value="replied">{statusT.replied}</SelectItem>
                      <SelectItem value="archived">{statusT.archived}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.close}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  )
}
