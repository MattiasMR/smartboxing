import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { handler } from '../../lib/http.js';
import { randomUUID } from 'crypto';
import { getRequiredTenantId } from '../../lib/auth.js';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Generar presigned URL para upload directo desde frontend
export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  
  const { fileName, fileType } = JSON.parse(event.body || '{}');
  
  // Validar tipo de archivo
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(fileType)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Tipo de archivo no permitido. Solo PNG, JPG y SVG.' 
      })
    };
  }

  // Sanitizar tenantId para que el key sea válido en URLs
  const normalizedTenantId = (tenantId.replace(/[^a-zA-Z0-9-_]/g, '-') || 'tenant');

  const extensionMap = {
    'image/svg+xml': 'svg'
  };
  const fileExtension = extensionMap[fileType] || fileType.split('/')[1];

  // Generar nombre único para el archivo
  const key = `logos/${normalizedTenantId}/${randomUUID()}.${fileExtension}`;
  const bucketName = `${process.env.SERVICE_NAME || 'smartboxing'}-assets-${process.env.STAGE || 'dev'}`;

  // Crear comando de PutObject
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // Generar URL firmada válida por 5 minutos
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  
  // URL pública del archivo (después del upload)
  const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
  };
});
