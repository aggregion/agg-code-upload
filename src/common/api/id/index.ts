import ServiceApi from '../serviceApi';
import {Method, RequestMaker, Service} from '../types';
import * as cliProgress from 'cli-progress';

const clientId = 'sgy1stn85h3y1kzjrqtlw7cum0wgjuuk';
const clientSecret = 'm9mh8e79pzskn97fe5hms9dlubhbp7pba5jo2okrw8fjsiko';

interface AuthResult {
  sessionId: string;
}

interface AuthRequest {
  login: string;
  password: string;
}

interface CodeResult {
  code: string;
}

interface TokenRequest {
  clientId: string;
  clientSecret: string;
  grantType: string;
  code: string;
}

interface TokenResult {
  token: string;
  refreshToken: string;
}

interface Account {
  id: string;
  name: string;
}

export default class IdApi extends ServiceApi {
  constructor(api: RequestMaker) {
    super(api, Service.id);
  }

  async getAccounts(): Promise<Account[]> {
    return this.makeRequest<Account[]>(Method.get, '/users/me/accounts?sort=name');
  }

  async login(login: string, password: string): Promise<TokenResult> {
    const authResult = await this.makeRequest<AuthResult, AuthRequest>(Method.post, '/auth/local', {
      body: {
        login,
        password,
      },
    }, null, false);
    const codeResult = await this.makeRequest<CodeResult>(
      Method.post,
      '/oauth/code',
      {body: {clientId, credentials: {id: ['main', 'accounts'], distribution: ['main'], market: ['main'], storage: ['main']}}},
      {'X-Session-Id': authResult.sessionId},
      false
    );
    return this.makeRequest<TokenResult, TokenRequest>(
      Method.post,
      '/oauth/token',
      {
        body: {
          clientId,
          clientSecret,
          grantType: 'code',
          code: codeResult.code,
        },
      },
      null,
      false
    );
  }
}
