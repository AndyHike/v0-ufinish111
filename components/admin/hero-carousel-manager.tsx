"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface CarouselSettings {
    enabled: boolean
    autoplay_interval: number
}

interface CarouselSlide {
    id: string
    image_url: string
    link: string
    sort_order: number
}

export function HeroCarouselManager() {
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [savingSettings, setSavingSettings] = useState(false)
    const [settings, setSettings] = useState<CarouselSettings>({
        enabled: false,
        autoplay_interval: 5000,
    })

    const [slides, setSlides] = useState<CarouselSlide[]>([])
    const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch("/api/admin/hero-carousel")
            if (response.ok) {
                const data = await response.json()
                setSettings(data.settings)
                setSlides(data.slides)
            }
        } catch (error) {
            console.error("Failed to fetch carousel data:", error)
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити дані",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        setSavingSettings(true)
        try {
            const response = await fetch("/api/admin/hero-carousel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })
            if (response.ok) {
                toast({ title: "Успіх", description: "Налаштування збережено" })
            } else {
                throw new Error("Failed to save settings")
            }
        } catch (error) {
            toast({
                title: "Помилка",
                description: "Не вдалося зберегти налаштування",
                variant: "destructive",
            })
        } finally {
            setSavingSettings(false)
        }
    }

    const handleAddSlide = async () => {
        const newSlide = {
            image_url: "",
            link: "/",
            sort_order: slides.length,
        }

        try {
            const response = await fetch("/api/admin/hero-carousel", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSlide),
            })
            if (response.ok) {
                fetchData()
                toast({ title: "Створено", description: "Слайд додано" })
            }
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося додати слайд", variant: "destructive" })
        }
    }

    const handleUpdateSlide = async (slide: CarouselSlide) => {
        try {
            const response = await fetch("/api/admin/hero-carousel", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(slide),
            })
            if (response.ok) {
                toast({ title: "Збережено", description: "Зміни слайда збережено" })
                fetchData()
            }
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося зберегти слайд", variant: "destructive" })
        }
    }

    const handleDeleteSlide = async (id: string) => {
        if (!confirm("Видалити цей слайд?")) return

        try {
            const response = await fetch(`/api/admin/hero-carousel?id=${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                setSlides(slides.filter((s) => s.id !== id))
                toast({ title: "Видалено", description: "Слайд видалено" })
            }
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося видалити слайд", variant: "destructive" })
        }
    }

    const handleImageUpload = async (slideId: string, file: File) => {
        setUploadingSlideId(slideId)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "hero-carousel")

        // Optional random string to avoid cache conflicts
        const randomSuffix = Math.random().toString(36).substring(7)
        formData.append("slug", `slide-${slideId}-${randomSuffix}`)

        try {
            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const data = await response.json()
            const updatedSlide = slides.find(s => s.id === slideId)
            if (updatedSlide) {
                const payload = { ...updatedSlide, image_url: data.url }
                await handleUpdateSlide(payload)
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({ title: "Помилка", description: "Не вдалося завантажити зображення", variant: "destructive" })
        } finally {
            setUploadingSlideId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Налаштування каруселі</CardTitle>
                    <CardDescription>Загальні налаштування слайдера на головній сторінці</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="space-y-0.5">
                            <Label>Увімкнути карусель</Label>
                            <p className="text-sm text-muted-foreground">
                                Показувати слайди. Якщо вимкнено - відображатиметься стандартне статичне зображення.
                            </p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Інтервал автозміни (мс)</Label>
                        <Input
                            type="number"
                            value={settings.autoplay_interval}
                            onChange={(e) => setSettings({ ...settings, autoplay_interval: parseInt(e.target.value) || 5000 })}
                            placeholder="5000"
                        />
                        <p className="text-sm text-muted-foreground">Наприклад, 5000 мс = 5 секунд.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Зберегти налаштування
                    </Button>
                </CardFooter>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Слайди</h2>
                <Button onClick={handleAddSlide}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати слайд
                </Button>
            </div>

            <div className="grid gap-6">
                {slides.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <p className="text-muted-foreground mb-4">Слайдів ще немає</p>
                            <Button onClick={handleAddSlide} variant="outline">Створити перший слайд</Button>
                        </CardContent>
                    </Card>
                ) : (
                    slides.map((slide, index) => (
                        <Card key={slide.id}>
                            <CardContent className="flex flex-col md:flex-row gap-6 p-6">
                                <div className="w-full md:w-1/3 flex flex-col gap-4">
                                    <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                                        {slide.image_url ? (
                                            <Image
                                                src={slide.image_url}
                                                alt="Slide preview"
                                                fill
                                                className="object-cover"
                                                unoptimized // Avoids next/image optimization issues with external URLs
                                            />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor={`image-${slide.id}`} className="cursor-pointer">
                                            <div className="inline-flex h-10 w-full items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-colors">
                                                {uploadingSlideId === slide.id ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Завантаження...</>
                                                ) : (
                                                    "Завантажити зображення"
                                                )}
                                            </div>
                                        </Label>
                                        <Input
                                            id={`image-${slide.id}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleImageUpload(slide.id, e.target.files[0])
                                                }
                                            }}
                                            disabled={uploadingSlideId === slide.id}
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-2/3 flex flex-col gap-4 justify-between">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Посилання (Link)</Label>
                                            <Input
                                                value={slide.link}
                                                onChange={(e) => {
                                                    const newSlides = [...slides]
                                                    newSlides[index].link = e.target.value
                                                    setSlides(newSlides)
                                                }}
                                                placeholder="/services або https://..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Куди перейде користувач при кліку на слайд
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Порядок сортування</Label>
                                            <Input
                                                type="number"
                                                value={slide.sort_order}
                                                onChange={(e) => {
                                                    const newSlides = [...slides]
                                                    newSlides[index].sort_order = parseInt(e.target.value) || 0
                                                    setSlides(newSlides)
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSlide(slide.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Видалити
                                        </Button>
                                        <Button onClick={() => handleUpdateSlide(slide)}>
                                            Зберегти зміни
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
