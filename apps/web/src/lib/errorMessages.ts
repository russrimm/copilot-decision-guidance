type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: string;
};

function looksLikeInvalidJsonPayload(payload: ApiErrorPayload): boolean {
  const text =
    `${payload.error || ''} ${payload.message || ''} ${payload.details || ''}`.toLowerCase();
  return (
    text.includes('invalid json payload') ||
    text.includes('malformed json') ||
    text.includes('bad unicode escape') ||
    text.includes('bad escaped character')
  );
}

export async function getFriendlyApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    if (payload) {
      if (looksLikeInvalidJsonPayload(payload)) {
        return 'The request text contains invalid characters or escape sequences. Please remove unusual backslashes or malformed Unicode and try again.';
      }
      if (payload.message) {
        return payload.message;
      }
      if (payload.error) {
        return payload.error;
      }
    }
  }

  const textBody = await response.text().catch(() => '');
  if (textBody.toLowerCase().includes('bad unicode escape')) {
    return 'The request text contains an invalid Unicode escape. Please revise the text and try again.';
  }

  return fallbackMessage;
}
