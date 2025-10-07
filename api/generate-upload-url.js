// File: /api/generate-upload-url.js
// Fokus untuk membuat link UPLOAD

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType are required." });
    }

    const s3Client = new S3Client({
        endpoint: `https://${process.env.B2_ENDPOINT}`,
        region: process.env.B2_REGION,
        credentials: {
            accessKeyId: process.env.B2_KEY_ID,
            secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
    });

    // Simpan path file untuk nanti digunakan
    const fileKey = `uploads/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
    });
    
    try {
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // Berlaku 5 menit
        
        // Kirim kembali URL upload dan path file-nya
        res.status(200).json({ uploadUrl, fileKey });
    } catch (error) {
        console.error("Error creating upload URL", error);
        res.status(500).json({ error: "Error creating upload URL" });
    }
}
