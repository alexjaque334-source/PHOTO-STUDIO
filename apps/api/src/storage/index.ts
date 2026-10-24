/**
 * Serviço de armazenamento R2 e URLs assinadas seguras.
 * Dono: Backend Engineer
 */
import type { Env } from '../env';
import type { StorageService } from '../contracts';
import { constantTimeCompare, hexToBuffer, hmacSha256 } from '../auth/crypto';

export interface SignedFileTokenPayload {
  key: string;
  userId: string;
  exp: number; // Unix timestamp em segundos
  dl?: boolean;
  fn?: string;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function createSignedFileToken(
  secret: string,
  payload: SignedFileTokenPayload,
): Promise<string> {
  const json = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(json);
  const sig = await hmacSha256(secret, encodedPayload);
  return `${encodedPayload}.${sig}`;
}

export async function verifySignedFileToken(
  secret: string,
  token: string,
): Promise<SignedFileTokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = await hmacSha256(secret, encodedPayload);
  const expectedBuf = hexToBuffer(expectedSig);
  const providedBuf = hexToBuffer(providedSig);

  if (!constantTimeCompare(expectedBuf, providedBuf)) {
    return null;
  }

  try {
    const json = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(json) as SignedFileTokenPayload;
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createStorageService(env: Env): StorageService {
  return {
    async putObject(key: string, bytes: ArrayBuffer, mime: string): Promise<void> {
      await env.MEDIA.put(key, bytes, {
        httpMetadata: {
          contentType: mime,
        },
      });
    },

    async getObject(key: string): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
      const obj = await env.MEDIA.get(key);
      if (!obj) return null;
      const bytes = await obj.arrayBuffer();
      const mime = obj.httpMetadata?.contentType || 'application/octet-stream';
      return { bytes, mime };
    },

    async deletePrefix(prefix: string): Promise<number> {
      let count = 0;
      let truncated = true;
      let cursor: string | undefined = undefined;

      while (truncated) {
        const list = await env.MEDIA.list({ prefix, cursor });
        if (list.objects.length > 0) {
          const keys = list.objects.map((o) => o.key);
          await env.MEDIA.delete(keys);
          count += keys.length;
        }
        truncated = list.truncated;
        cursor = list.truncated ? list.cursor : undefined;
      }

      return count;
    },

    async deleteKeys(keys: string[]): Promise<void> {
      if (keys.length === 0) return;
      await env.MEDIA.delete(keys);
    },

    async signedUrl(input: {
      key: string;
      userId: string;
      ttlSeconds?: number;
      download?: boolean;
      filename?: string;
    }): Promise<{ url: string; expiresAt: string }> {
      const ttl = input.ttlSeconds ?? 300; // 5 minutos padrão
      const expiresTimestamp = Date.now() + ttl * 1000;
      const expSec = Math.floor(expiresTimestamp / 1000);
      const expiresAt = new Date(expiresTimestamp).toISOString();

      const token = await createSignedFileToken(env.SESSION_SECRET, {
        key: input.key,
        userId: input.userId,
        exp: expSec,
        dl: input.download,
        fn: input.filename,
      });

      const url = `/api/files/${token}`;
      return { url, expiresAt };
    },
  };
}
