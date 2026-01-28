import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';

export interface LoginRequest {
    username: string;
    password?: string;
}

export interface LoginResponse {
    token: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}/api/auth/login`;

    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
    } catch (e: any) {
        if (__DEV__) {
            throw new Error(`Network request failed. Tried: ${url}.`);
        }
        throw new Error('Network request failed');
    }

    if (!res.ok) {
        const err = await readErrorResponse(res);
        throw new ApiError(res.status, err.message, err.body);
    }

    return (await res.json()) as LoginResponse;
}
