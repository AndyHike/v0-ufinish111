import SignInClient from "./signin-client"

export default function SignInPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <SignInClient />
      </div>
    </div>
  )
}
