const BASE_URL = 'https://www.shreesaisenthiltravels.com'; // Production Domain

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

export const api = {
    defaults: { headers: { common: {} as Record<string, string> } },
    async get<T = unknown>(path: string): Promise<{ data: T }> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`${BASE_URL}${path}`, { headers });
        if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
        return { data: await res.json() as T };
    },
    async post<T = unknown>(path: string, body?: unknown): Promise<{ data: T }> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
        return { data: await res.json() as T };
    },
    async put<T = unknown>(path: string, body?: unknown): Promise<{ data: T }> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'PUT',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
        return { data: await res.json() as T };
    },
    async delete<T = unknown>(path: string): Promise<{ data: T }> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
        return { data: await res.json() as T };
    },
};

