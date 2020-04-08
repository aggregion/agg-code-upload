import {Command} from '@oclif/command';
import * as path from 'path';
import * as fs from 'fs';
import * as cliProgress from 'cli-progress';
import * as prettyBytes from 'pretty-bytes';
import Api from '../../common/api';
import {File} from '../../common/api/storage';
import {Options} from 'cli-progress';

export default class UploadCommand extends Command {
  static description = 'Upload file to storage';

  static usage = 'upload [file1] [file2] [...] [fileN]';

  static strict = false;

  static args = [
    {
      name: 'files',
      required: true,
      description: 'List of files',
    },
  ];

  async run() {
    const {argv} = this.parse(UploadCommand);
    const api = new Api();
    const fmap: { [key: string]: { size: number; pb: any; fileName: string } } = {};
    const multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} | {percentage}% | {filename} | {valueP} / {totalP}',
      autopadding: true,
    } as Options, cliProgress.Presets.shades_grey);
    for (const file of argv) {
      if (!fs.existsSync(file)) {
        return this.error(`File ${file} does not exist`);
      }
      const size = fs.lstatSync(file).size;
      const fileName = path.basename(file);
      fmap[file] = {
        size,
        fileName,
        pb: multibar.create(size, 0, {filename: fileName, totalP: prettyBytes(size)}),
      };
    }
    const promises: Promise<File>[] = [];
    for (const file of argv) {
      const data = fmap[file];
      promises.push(api.Storage.uploadFile(data.fileName, file, false, uploadedBytes => {
        data.pb.update(uploadedBytes, {valueP: prettyBytes(uploadedBytes)});
      }));
    }
    await Promise.all(promises);
    multibar.stop();
    this.log('Complete!');
  }
}
