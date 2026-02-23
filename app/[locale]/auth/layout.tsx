import type { Metadata } from "next"

// All auth pages are noindex — login/register/reset flows must not appear in search
export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
