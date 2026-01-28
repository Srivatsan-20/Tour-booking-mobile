import { getAuthToken } from '../storage/auth';

export async function fetchApi(url: string, init?: RequestInit): Promise<Response> {
    const token = await getAuthToken();

    const headers = new Headers(init?.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Ensure we have JSON content type if body is present (unless FormData)
    if (init?.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...init,
        headers,
    };

    return fetch(url, config);
}
