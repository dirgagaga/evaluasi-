// File: /api/generate-upload-url.js

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
    // Ambil nama file dari query parameter
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType query parameters are required." });
    }

    // Konfigurasi koneksi ke Backblaze B2
    const s3Client = new S3Client({
        endpoint: `https://${process.env.B2_ENDPOINT}`,
        region: process.env.B2_REGION, // e.g. "us-west-004"
        credentials: {
            accessKeyId: process.env.B2_KEY_ID,
            secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
    });

    // Perintah untuk mengunggah objek (file)
    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: `uploads/${Date.now()}_${fileName}`, // Nama file unik di B2
        ContentType: fileType,
    });
    
    try {
        // Buat URL upload khusus yang berlaku selama 60 detik
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
        
        // Buat URL publik untuk melihat file setelah diunggah
        const publicFileUrl = `https://f004.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${command.input.Key}`;

        // Kirim kembali URL-URL ini ke frontend
        res.status(200).json({ uploadUrl, publicFileUrl });
    } catch (error) {
        console.error("Error creating presigned URL", error);
        res.status(500).json({ error: "Error creating presigned URL" });
    }
}
