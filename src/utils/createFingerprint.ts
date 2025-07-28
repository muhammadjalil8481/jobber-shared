import { Request } from 'express';
import crypto from 'crypto';

export function createFingerprint(req: Request): string {
  // Collect fingerprint components
  const components = {
    ua: req.headers['user-agent'] || '', // Browser/OS information
    // ip: req.ip, // Client IP address
    lang: req.headers['accept-language'] || '', // Language preferences
    enc: req.headers['accept-encoding'] || '', // Compression support
    dnt: req.headers['dnt'] || '', // Do Not Track status
  };

  // Create a stable string representation
  const fingerprintString = JSON.stringify(components);

  // Generate SHA-256 hash
  return crypto.createHash('sha512').update(fingerprintString).digest('hex');
}
