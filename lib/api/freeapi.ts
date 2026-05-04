import { http, HttpError } from '@/lib/api/http';
import { FREEAPI_BASE_URL } from '@/lib/config';

export type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data: T;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type FreeApiUser = {
  _id: string;
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  coverImage?: string;
};

export type LoginPayload = { usernameOrEmail: string; password: string };
export type RegisterPayload = { username: string; email: string; password: string; fullName: string };

export type RandomUser = {
  name?: { first?: string; last?: string };
  email?: string;
  picture?: { thumbnail?: string; medium?: string; large?: string };
  login?: { uuid?: string };
};

export type RandomProduct = {
  id?: number;
  title?: string;
  description?: string;
  category?: string;
  thumbnail?: string;
  images?: string[];
  price?: number;
  rating?: number;
};

function unwrap<T>(env: ApiEnvelope<T>): T {
  return env?.data ?? (env as unknown as T);
}

export async function freeapiLogin(payload: LoginPayload): Promise<{ user: FreeApiUser; tokens: AuthTokens }> {
  const usernameOrEmail = payload.usernameOrEmail.trim();
  const password = payload.password;
  const body =
    usernameOrEmail.includes('@')
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

  const env = await http<ApiEnvelope<{ user: FreeApiUser; accessToken: string; refreshToken?: string }>>({
    url: `${FREEAPI_BASE_URL}/api/v1/users/login`,
    method: 'POST',
    body,
  });
  const data = unwrap(env);
  return { user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } };
}

export async function freeapiRegister(
  payload: RegisterPayload
): Promise<{ user: FreeApiUser }> {
  const env = await http<ApiEnvelope<{ user: FreeApiUser }>>({
    url: `${FREEAPI_BASE_URL}/api/v1/users/register`,
    method: 'POST',
    body: payload,
  });

  const data = unwrap(env);

  return {
    user: data.user,
  };
}

export async function freeapiMe(accessToken: string): Promise<FreeApiUser> {
  const env = await http<ApiEnvelope<FreeApiUser>>({
    url: `${FREEAPI_BASE_URL}/api/v1/users/current-user`,
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return unwrap(env);
}

export async function freeapiRefresh(refreshToken: string): Promise<AuthTokens> {
  try {
    const env = await http<ApiEnvelope<{ accessToken: string; refreshToken?: string }>>({
      url: `${FREEAPI_BASE_URL}/api/v1/users/refresh-token`,
      method: 'POST',
      body: { refreshToken },
    });
    const data = unwrap(env);
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) {
      throw new Error('Refresh endpoint not available');
    }
    throw e;
  }
}

export async function freeapiRandomUsers(): Promise<RandomUser[]> {
  const env = await http<ApiEnvelope<{ users: RandomUser[] }>>({
    url: `${FREEAPI_BASE_URL}/api/v1/public/randomusers`,
    method: 'GET',
  });
  const data = unwrap(env);
  return (data as any).users ?? (data as any) ?? [];
}

export async function freeapiRandomProducts(): Promise<RandomProduct[]> {
  const env = await http<ApiEnvelope<{ products: RandomProduct[] }>>({
    url: `${FREEAPI_BASE_URL}/api/v1/public/randomproducts`,
    method: 'GET',
  });
  const data = unwrap(env);
  return (data as any).data ?? (data as any) ?? [];
}
