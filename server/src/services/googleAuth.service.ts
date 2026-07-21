import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
  emailVerified?: boolean;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new Error('Google token không hợp lệ');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    fullName: payload.name || payload.email,
    avatar: payload.picture,
    emailVerified: payload.email_verified,
  };
}
