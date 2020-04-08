import ServiceApi from '../serviceApi';
import {Method, RequestMaker, Service} from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime';

export type ProgressCallback = (uploadedBytes: number, totalBytes: number) => void;

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  sharing: {
    byLink: boolean;
  };
}

export default class StorageApi extends ServiceApi {
  constructor(api: RequestMaker) {
    super(api, Service.storage);
  }

  async uploadFile(name: string, filePath: string, share: boolean, progressCallback?: ProgressCallback): Promise<File> {
    const size = fs.lstatSync(filePath).size;
    let bytes = 0;
    const formData = {
      meta: {
        value: JSON.stringify({
          name,
          sharing: {
            byLink: share,
          },
        }),
        options: {
          contentType: 'application/json',
        },
      },
      data: {
        value: fs.createReadStream(filePath).on('data', chunk => {
          if (progressCallback) {
            progressCallback(bytes += chunk.length, size);
          }
        }),
        options: {
          filename: path.parse(filePath).base,
          contentType: mime.getType(filePath),
        },
      },
    };
    return this.makeRequest(Method.post, '/files', {formData});
  }
}
