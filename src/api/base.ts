import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';

let authToken: string | null = null;
let tenantId: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

export const setTenantId = (id: string | null) => {
    tenantId = id;
};

async function throwApiError(res: Response): Promise<never> {
    const err = await readErrorResponse(res);
    throw new ApiError(res.status, err.message, err.body);
}

export async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const baseUrl = await getApiBaseUrl();
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (authToken) {
        (headers as any)['Authorization'] = `Bearer ${authToken}`;
    }

    if (tenantId) {
        (headers as any)['Tenant-Id'] = tenantId;
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        await throwApiError(res);
    }

    if (res.status === 204) return {} as T;

    return (await res.json()) as T;
}

export const api = {
    get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: any, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body?: any, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
