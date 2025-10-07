// File: /api/get-download-url.js
// Fokus untuk membuat link DOWNLOAD

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
    const { fileKey } = req.query;

    if (!fileKey) {
        return res.status(400).json({ error: "fileKey query parameter is required." });
    }

    const s3Client = new S3Client({
        endpoint: `httpshttps://${process.env.B2_ENDPOINT}`,
        region: process.env.B2_REGION,
        credentials: {
            accessKeyId: process.env.B2_KEY_ID,
            secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
    });

    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileKey,
    });
    
    try {
        // Buat URL download khusus yang berlaku selama 1 jam (3600 detik)
        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        res.status(200).json({ downloadUrl });
    } catch (error) {
        console.error("Error creating download URL", error);
        res.status(500).json({ error: "Error creating download URL" });
    }
}
