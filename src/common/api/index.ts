import Request, {Credentials, CredentialsStorage} from './request';
import MarketApi from './market';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import IdApi from './id';
import StorageApi from './storage';

const configDir = path.join(os.homedir(), '.aggregion');
const configPath = path.join(configDir, '/session.json');

class Api implements CredentialsStorage {
  public readonly Id: IdApi;

  public readonly Market: MarketApi;

  public readonly Storage: StorageApi;

  constructor() {
    const request = new Request(this);
    this.Id = new IdApi(request);
    this.Market = new MarketApi(request);
    this.Storage = new StorageApi(request);
  }

  async saveCredentials(cred: Credentials): Promise<void> {
    const data = JSON.stringify(cred, null, 2);
    mkdirp.sync(configDir);
    fs.writeFileSync(configPath, data, 'utf8');
  }

  public async getCredentials(): Promise<Credentials> {
    if (!fs.existsSync(configPath)) {
      throw new Error('Please login');
    }
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  }
}

export default Api;
