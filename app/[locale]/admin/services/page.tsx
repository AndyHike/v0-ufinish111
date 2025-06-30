import { ServicesManagement } from "@/components/admin/services-management"

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Управління послугами</h1>
        <p className="text-muted-foreground">
          Керуйте послугами, їх описами, цінами та іншими параметрами на всіх мовах
        </p>
      </div>
      <ServicesManagement />
    </div>
  )
}
