import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.CLOUDFLARE_ENDPOINT_URL || 'https://placeholder.r2.cloudflarestorage.com'
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || 'placeholder'
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || 'placeholder'

export const s3Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})
