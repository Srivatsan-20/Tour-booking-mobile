const BASE_URL = 'https://www.shreesaisenthiltravels.com';

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
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            const error: any = new Error(errText || `GET ${path} failed: ${res.status}`);
            error.response = { status: res.status, data: errText };
            throw error;
        }
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
        if (!res.ok) {
            let errorMsg = `POST ${path} failed: ${res.status}`;
            let rawData: any = null;
            try {
                const errText = await res.text();
                rawData = errText;
                try {
                    const errJson = JSON.parse(errText);
                    errorMsg = errJson.message || errJson.title || errText;
                    rawData = errJson;
                } catch {
                    if (errText) errorMsg = errText;
                }
            } catch {}
            const error: any = new Error(errorMsg);
            error.response = {
                status: res.status,
                data: typeof rawData === 'string' ? rawData : (rawData?.message || rawData?.title || errorMsg)
            };
            throw error;
        }
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
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            const error: any = new Error(errText || `PUT ${path} failed: ${res.status}`);
            error.response = { status: res.status, data: errText };
            throw error;
        }
        return { data: await res.json() as T };
    },
    async delete<T = unknown>(path: string): Promise<{ data: T }> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            const error: any = new Error(errText || `DELETE ${path} failed: ${res.status}`);
            error.response = { status: res.status, data: errText };
            throw error;
        }
        return { data: await res.json() as T };
    },
};
