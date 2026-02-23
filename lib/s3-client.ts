import { S3Client } from '@aws-sdk/client-s3'

if (!process.env.CLOUDFLARE_ENDPOINT_URL) {
  throw new Error('CLOUDFLARE_ENDPOINT_URL is not set')
}
if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) {
  throw new Error('CLOUDFLARE_ACCESS_KEY_ID is not set')
}
if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
  throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY is not set')
}

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
})
