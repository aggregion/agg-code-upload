import {Method, RequestData, RequestMaker, Service, ServiceRequestMaker} from './types';

export default class ServiceApi implements ServiceRequestMaker {
  private readonly _api: RequestMaker;

  private readonly _service: Service;

  constructor(api: RequestMaker, service: Service) {
    this._api = api;
    this._service = service;
  }

  makeRequest<T, B = any>(method: Method, path: string, requestData?: RequestData<B> | null, headers?: object | null, secure = true): Promise<T> {
    return this._api.makeRequest(this._service, method, path, requestData, headers, secure);
  }
}
