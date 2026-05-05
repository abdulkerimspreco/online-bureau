import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey() {
  const secret =
    process.env.CV_ENCRYPTION_SECRET ?? 'online-bureau-dev-cv-secret';

  return createHash('sha256').update(secret).digest();
}

export function encryptCvBuffer(buffer: Buffer) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptCvBuffer(
  encrypted: Buffer,
  iv: string,
  authTag: string,
) {
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
