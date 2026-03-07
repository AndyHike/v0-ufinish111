"use server"

import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { getSession } from "@/lib/auth/session"

export interface DiscountBatchRequest {
    serviceId: string
    modelId: string
    originalPrice: number
}

export interface DiscountBatchResponse {
    [serviceId: string]: {
        discountedPrice: number | null
        hasDiscount: boolean
        discount: any | null
        actualDiscountPercentage: number | null
    }
}

/**
 * Fetch discounts in batch for a set of services and a specific model.
 * This can be safely called from Client Components without breaking SSG, 
 * as the fetch happens dynamically at runtime in the user's browser.
 * User authentication and roles are handled automatically by getPriceWithDiscount inside the server action.
 */
export async function getDiscountsBatch(requests: DiscountBatchRequest[]): Promise<DiscountBatchResponse> {
    try {
        const results: DiscountBatchResponse = {}
        const session = await getSession()
        const userId = session?.user?.id

        // Process all requests in parallel
        const promises = requests.map(async (req) => {
            if (req.originalPrice === null || req.originalPrice === undefined) {
                return {
                    serviceId: req.serviceId,
                    data: {
                        discountedPrice: null,
                        hasDiscount: false,
                        discount: null,
                        actualDiscountPercentage: null
                    }
                }
            }

            const discountInfo = await getPriceWithDiscount(req.serviceId, req.modelId, req.originalPrice, userId)

            return {
                serviceId: req.serviceId,
                data: {
                    discountedPrice: discountInfo.discountedPrice,
                    hasDiscount: discountInfo.hasDiscount,
                    discount: discountInfo.discount || null,
                    actualDiscountPercentage: discountInfo.actualDiscountPercentage || null
                }
            }
        })

        const settledPromises = await Promise.all(promises)

        for (const result of settledPromises) {
            results[result.serviceId] = result.data
        }

        return results
    } catch (error) {
        console.error("[DiscountsBatch] Failed to fetch branch discounts:", error)
        // Return empty results rather than throwing to avoid breaking the client UI
        return {}
    }
}
