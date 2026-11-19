export class ApiError<TBody = unknown> extends Error {
  status: number;
  body: TBody | undefined;

  constructor(status: number, message: string, body?: TBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function readErrorResponse(res: Response): Promise<{ message: string; body?: unknown }> {
  const text = await res.text().catch(() => '');
  if (!text) return { message: `Request failed (${res.status})` };

  try {
    const json = JSON.parse(text);
    if (typeof json === 'string') return { message: json, body: json };
    if (json && typeof json.message === 'string') return { message: json.message, body: json };
    return { message: text, body: json };
  } catch {
    return { message: text };
  }
}
