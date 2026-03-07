import { RolesManagement } from "@/components/admin/roles-management"

export default function RolesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Ролі</h2>
            </div>
            <div className="space-y-4">
                <RolesManagement />
            </div>
        </div>
    )
}
