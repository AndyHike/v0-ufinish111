"use client"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"

interface UserNavProps {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function UserNav({ user }: UserNavProps) {
  const t = useTranslations("Header")
  const params = useParams()
  const locale = params.locale as string

  // Тимчасово прибираємо всю функціональність входу
  // Повертаємо null, щоб нічого не відображалося
  return null

  // Закоментований код для швидкого відновлення функціональності
  /*
  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/auth/signin`}>
          <User className="mr-2 h-4 w-4" />
          {t("signIn")}
        </Link>
      </Button>
    )
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/profile`}>
            <User className="mr-2 h-4 w-4" />
            <span>{t("profile")}</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin`}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("admin")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  */
}
