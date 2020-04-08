import ServiceApi from '../serviceApi';
import {RequestMaker, Service} from '../types';
import PromoCampaignsApi from './promoCampaigns';

export default class MarketApi extends ServiceApi {
  public readonly PromoCampaigns: PromoCampaignsApi;

  constructor(api: RequestMaker) {
    super(api, Service.market);
    this.PromoCampaigns = new PromoCampaignsApi(this);
  }
}
