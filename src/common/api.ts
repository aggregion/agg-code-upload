import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as request from 'request-promise';
import * as mkdirp from 'mkdirp';

const clientId = 'sgy1stn85h3y1kzjrqtlw7cum0wgjuuk';
const clientSecret = 'm9mh8e79pzskn97fe5hms9dlubhbp7pba5jo2okrw8fjsiko';
const configDir =  path.join(os.homedir(), '.aggregion');
const configPath = path.join(configDir, '/session.json');

interface Credentials {
  token: string;
  refreshToken: string;
  account?: string;
}

enum Service {
  id = 'id',
  market = 'market'
}

enum Method {
  get = 'get',
  put = 'put',
  post = 'post'
}

interface Title {
  default: string;
}

interface Catalog {
  title: Title;
}

interface Good {
  id: string;
  catalog: Catalog;
}

export interface PromoCampaign {
  id: string;
  name: string;
  goods: Good[];
}

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
  // {"clientId":"0","clientSecret":"@Mqb8Xh7m5N5~eW","grantType":"code","code":"942e91a776558f540bdcef358df31cbe","refreshToken":null}
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

interface CodeLink {
  promoCampaign: string;
}

export interface Code {
  type: string;
  code: string;
  link: CodeLink;
  forcedChosenGoods?: string[];
}

export default class Api {
  async saveCredentials(cred: Credentials): Promise<void> {
    const data = JSON.stringify(cred, null, 2);
    mkdirp.sync(configDir);
    fs.writeFileSync(configPath, data, 'utf8');
  }

  async getAccounts(): Promise<Account[]> {
    return this._makeRequest<Account[]>(Service.id, Method.get, '/users/me/accounts?sort=name');
  }

  async login(login: string, password: string): Promise<TokenResult> {
    const authResult = await this._makeRequest<AuthResult, AuthRequest>(Service.id, Method.post, '/auth/local', {login, password}, null, false);
    const codeResult = await this._makeRequest<CodeResult>(
      Service.id,
      Method.post,
      '/oauth/code',
      {clientId, credentials: {id: ['main', 'accounts'], distribution: ['main'], market: ['main']}},
      {'X-Session-Id': authResult.sessionId},
      false
    );
    return this._makeRequest<TokenResult, TokenRequest>(
      Service.id,
      Method.post,
      '/oauth/token',
      {
        clientId,
        clientSecret,
        grantType: 'code',
        code: codeResult.code,
      },
      null,
      false
    );
  }

  async getPromoCampaigns(): Promise<PromoCampaign[]> {
    return this._makeRequest<PromoCampaign[]>(Service.market, Method.get, '/promoCampaigns?sort=name&status(%22archived%22,notequals)&extend=goods,goods.catalog');
  }

  async uploadCodes(codes: Code[]): Promise<Code[]> {
    return this._makeRequest<Code[], Code[]>(Service.market, Method.post, '/codes/multi', codes);
  }

  // eslint-disable-next-line max-params
  private async _makeRequest<T, B = any>(service: Service, method: Method, path: string, body?: B | null, headers?: object | null, secure = true): Promise<T> {
    const uri = `https://${service}.aggregion.com/api/${path}`;
    const options: any = {
      uri,
      method,
      json: true,
      body,
      headers,
    };
    if (secure) {
      const credentials = await Api._getCredentials();
      options.headers = {
        ...options.headers,
        'X-Access-Token': credentials.token,
        'X-Account': credentials.account,
      };
    }
    return request(options);
  }

  private static async _getCredentials(): Promise<Credentials> {
    if (!fs.existsSync(configPath)) {
      throw new Error('Please login');
    }
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  }
}
