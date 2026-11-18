/** The HTTP client outbound adapters use; injectable so tests never open a socket. */
export type FetchFunction = (input: URL, init: RequestInit) => Promise<Response>;
