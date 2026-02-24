let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${getBaseUrl()}${path}`;
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorBody = await response.text();
        // Special handling for 401
        if (response.status === 401) {
            // Clear token if it's invalid
            setAuthToken(null);
        }
        throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();
}

export const api = {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
