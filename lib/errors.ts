export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'invalidtoken'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'offline';

export type Surface =
  | 'chat'
  | 'auth'
  | 'api'
  | 'stream'
  | 'database'
  | 'history'
  | 'vote'
  | 'document'
  | 'suggestions';

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = 'response' | 'log' | 'none';

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  stream: 'response',
  api: 'response',
  history: 'response',
  vote: 'response',
  document: 'response',
  suggestions: 'response',
};

export class ChatSDKError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(':');

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === 'log') {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: '', message: 'errors.some_thing_wrong' },
        { status: statusCode },
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes('database')) {
    return 'errors.database_query_error';
  }

  switch (errorCode) {
    case 'bad_request:api':
      return 'errors.bad_request.api';

    case 'unauthorized:auth':
      return 'errors.unauthorized.auth';
    case 'invalidtoken:auth':
      return 'errors.invalidtoken.auth';
    case 'forbidden:auth':
      return 'errosr.forbidden.auth';

    case 'rate_limit:chat':
      return 'errors.rate_limit.chat';
    case 'not_found:chat':
      return 'errors.not_found.chat';
    case 'forbidden:chat':
      return 'errors.forbidden.chat';
    case 'unauthorized:chat':
      return 'errors.unauthorized.chat';
    case 'offline:chat':
      return 'errors.offline.chat';

    case 'not_found:document':
      return 'errors.not_found.document';
    case 'forbidden:document':
      return 'errors.forbidden.document';
    case 'unauthorized:document':
      return 'errors.unauthorized.document';
    case 'bad_request:document':
      return 'errors.bad_request.document';

    default:
      return 'errors.some_thing_wrong';
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}
