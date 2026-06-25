"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Eye, FileText, Plus, Trash2, Pencil, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"

type LegalDocument = {
  id: string
  slug: string
  title_cs: string
  title_uk: string
  title_en: string
  content: string
  is_active: boolean
  required_at_registration: boolean
  sort_order: number
}

type DraftDocument = Omit<LegalDocument, "id"> & { id: string | null }

const EMPTY_DRAFT: DraftDocument = {
  id: null,
  slug: "",
  title_cs: "",
  title_uk: "",
  title_en: "",
  content: "",
  is_active: true,
  required_at_registration: false,
  sort_order: 0,
}

export function LegalDocumentsManager() {
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [draft, setDraft] = useState<DraftDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/legal-documents")
      if (!response.ok) throw new Error("Failed to load")
      const data = await response.json()
      setDocuments(data.documents ?? [])
    } catch (error) {
      console.error("Error fetching legal documents:", error)
      toast({ title: "Error", description: "Failed to load documents", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const startNew = () => setDraft({ ...EMPTY_DRAFT })
  const startEdit = (doc: LegalDocument) => setDraft({ ...doc })

  const updateDraft = (patch: Partial<DraftDocument>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleSave = async () => {
    if (!draft) return
    if (!draft.slug.trim()) {
      toast({ title: "Error", description: "Slug is required", variant: "destructive" })
      return
    }
    if (!draft.title_cs.trim()) {
      toast({ title: "Error", description: "Czech title is required", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const isUpdate = Boolean(draft.id)
      const response = await fetch(
        isUpdate ? `/api/admin/legal-documents/${draft.id}` : "/api/admin/legal-documents",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save")
      }

      toast({ title: "Success", description: `Document "${draft.slug}" saved` })
      setDraft(null)
      await fetchDocuments()
    } catch (error: any) {
      console.error("Error saving legal document:", error)
      toast({ title: "Error", description: error.message || "Failed to save document", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (doc: LegalDocument) => {
    if (!confirm(`Delete document "${doc.slug}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/legal-documents/${doc.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: `Document "${doc.slug}" removed` })
      if (draft?.id === doc.id) setDraft(null)
      await fetchDocuments()
    } catch (error) {
      console.error("Error deleting legal document:", error)
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" })
    }
  }

  // Quick inline toggle of the active flag from the list.
  const toggleActive = async (doc: LegalDocument, value: boolean) => {
    try {
      const response = await fetch(`/api/admin/legal-documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: value }),
      })
      if (!response.ok) throw new Error("Failed")
      await fetchDocuments()
    } catch (error) {
      console.error("Error toggling active:", error)
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Legal Documents</CardTitle>
            <CardDescription>
              Manage footer documents (privacy, terms, …). Title is per-language; the body is shared (markdown).
            </CardDescription>
          </div>
          <Button onClick={startNew} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add document
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-gray-500">No documents yet.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{doc.title_cs || doc.slug}</span>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">/{doc.slug}</code>
                  {doc.required_at_registration && <Badge variant="secondary">registration</Badge>}
                </div>
                <p className="text-xs text-gray-500">sort: {doc.sort_order}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={doc.is_active} onCheckedChange={(v) => toggleActive(doc, v)} />
                  <span className="text-xs text-gray-500">{doc.is_active ? "Active" : "Hidden"}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => startEdit(doc)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{draft.id ? `Edit: ${draft.slug}` : "New document"}</CardTitle>
              <CardDescription>
                {draft.id ? "Slug cannot be changed after creation." : "Slug becomes the URL: /legal/<slug>."}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDraft(null)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-slug">Slug *</Label>
                <Input
                  id="doc-slug"
                  value={draft.slug}
                  disabled={Boolean(draft.id)}
                  placeholder="vop-b2b"
                  onChange={(e) => updateDraft({ slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-sort">Sort order</Label>
                <Input
                  id="doc-sort"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => updateDraft({ sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="title-cs">Title (CS) *</Label>
                <Input id="title-cs" value={draft.title_cs} onChange={(e) => updateDraft({ title_cs: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-uk">Title (UK)</Label>
                <Input id="title-uk" value={draft.title_uk} onChange={(e) => updateDraft({ title_uk: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-en">Title (EN)</Label>
                <Input id="title-en" value={draft.title_en} onChange={(e) => updateDraft({ title_en: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="doc-active"
                  checked={draft.is_active}
                  onCheckedChange={(v) => updateDraft({ is_active: v })}
                />
                <Label htmlFor="doc-active">Active (visible in footer)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="doc-required"
                  checked={draft.required_at_registration}
                  onCheckedChange={(v) => updateDraft({ required_at_registration: v })}
                />
                <Label htmlFor="doc-required">Required consent at registration</Label>
              </div>
            </div>

            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-2">
                <Label htmlFor="doc-content">Content (Markdown, shared across languages)</Label>
                <Textarea
                  id="doc-content"
                  value={draft.content}
                  onChange={(e) => updateDraft({ content: e.target.value })}
                  placeholder="# Heading…"
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="space-y-2">
                <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                  {draft.content ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{draft.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No content to preview</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save document
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
