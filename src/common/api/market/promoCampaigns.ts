import {Method, ServiceRequestMaker} from '../types';

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

interface CodeLink {
  promoCampaign: string;
}

export interface Code {
  type: string;
  code: string;
  link: CodeLink;
  forcedChosenGoods?: string[];
}

export default class PromoCampaignsApi  {
  private readonly _api: ServiceRequestMaker;

  constructor(api: ServiceRequestMaker) {
    this._api = api;
  }

  async getPromoCampaigns(): Promise<PromoCampaign[]> {
    return this._api.makeRequest<PromoCampaign[]>(Method.get, '/promoCampaigns?sort=name&status(%22archived%22,notequals)&extend=goods,goods.catalog');
  }

  async uploadCodes(codes: Code[]): Promise<Code[]> {
    return this._api.makeRequest<Code[], Code[]>(Method.post, '/codes/multi', {body: codes});
  }
}
