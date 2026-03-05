import { S3Client } from '@aws-sdk/client-s3'

// Lazy-init to avoid crashing at build time when env vars are missing
let _s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!_s3Client) {
    if (!process.env.CLOUDFLARE_ENDPOINT_URL) {
      throw new Error('CLOUDFLARE_ENDPOINT_URL is not set')
    }
    if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) {
      throw new Error('CLOUDFLARE_ACCESS_KEY_ID is not set')
    }
    if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
      throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY is not set')
    }

    _s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      },
    })
  }
  return _s3Client
}

// Backward-compatible export (lazy getter)
export const s3Client = new Proxy({} as S3Client, {
  get(_, prop) {
    return (getS3Client() as any)[prop]
  },
})
