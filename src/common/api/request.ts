import * as request from 'request-promise';
import {Method, RequestData, RequestMaker, Service} from './types';

export interface Credentials {
  token: string;
  refreshToken: string;
  account?: string;
}

export interface CredentialsStorage {
  getCredentials: () => Promise<Credentials>;
  saveCredentials: (cred: Credentials) => Promise<void>;
}

export default class Request implements RequestMaker {
  private readonly _credentialsStorage: CredentialsStorage;

  constructor(credentialsStorage: CredentialsStorage) {
    this._credentialsStorage = credentialsStorage;
  }

  // eslint-disable-next-line max-params
  public async makeRequest<T, B = any>(service: Service, method: Method, path: string, requestData?: RequestData<B> | null, headers?: object | null, secure = true): Promise<T> {
    const uri = `https://${service}.aggregion.com/api/${path}`;
    let options: any = {
      uri,
      method,
      json: true,
      headers,
    };
    if (requestData) {
      options = {...options, ...requestData};
    }
    if (secure) {
      const credentials = await this._credentialsStorage.getCredentials();
      options.headers = {
        ...options.headers,
        'X-Access-Token': credentials.token,
        'X-Account': credentials.account,
      };
    }
    return request(options);
  }
}
