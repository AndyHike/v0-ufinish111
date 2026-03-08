export type CarouselData = {
    enabled: boolean
    autoplay_interval: number
    slides: {
        id: string
        image_url: string
        link: string
    }[]
}
