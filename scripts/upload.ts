import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';

function getR2Client(): S3Client {
	const accountId = process.env.R2_ACCOUNT_ID;
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

	if (!accountId || !accessKeyId || !secretAccessKey) {
		throw new Error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.');
	}

	return new S3Client({
		region: 'auto',
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: { accessKeyId, secretAccessKey }
	});
}

const MIME_TYPES: Record<string, string> = {
	'.avif': 'image/avif',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg'
};

export async function uploadFile(localPath: string, remotePath: string): Promise<void> {
	const client = getR2Client();
	const bucket = process.env.R2_BUCKET_NAME || 'photo-rama';
	const ext = path.extname(localPath).toLowerCase();
	const contentType = MIME_TYPES[ext] || 'application/octet-stream';

	const body = await fs.readFile(localPath);

	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: remotePath,
			Body: body,
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);
}

export async function uploadVariants(
	files: Array<{ filePath: string; relativePath: string }>
): Promise<void> {
	for (const file of files) {
		console.log(`  Uploading ${file.relativePath}...`);
		await uploadFile(file.filePath, file.relativePath);
	}
}
