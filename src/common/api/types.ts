export interface RequestData<T> {
  body?: T;
  formData?: T;
}

export enum Service {
  id = 'id',
  market = 'market',
  storage = 'storage'
}

export enum Method {
  get = 'get',
  put = 'put',
  post = 'post'
}

export interface RequestMaker {
  makeRequest: <T, B = any>(service: Service, method: Method, path: string, requestData?: RequestData<B> | null, headers?: object | null, secure?: boolean) => Promise<T>;
}

export interface ServiceRequestMaker {
  makeRequest: <T, B = any>(method: Method, path: string, requestData?: RequestData<B> | null, headers?: object | null, secure?: boolean) => Promise<T>;
}

