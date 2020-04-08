import {Command} from '@oclif/command';
import {cli} from 'cli-ux';

import * as fs from 'fs';
import PearsonConverter from '../../common/pearsonConverter/pearsonConverter';

export default class PrepareCommand extends Command {
  static description = 'Prepare content to work in Aggregion Reader';

  static usage = 'prepare [dir1] [dir2] [...] [dirN]';

  static strict = false;

  static args = [
    {
      name: 'dirs',
      required: true,
      description: 'List of directories',
    },
  ];

  async run() {
    const {argv} = this.parse(PrepareCommand);
    for (const dir of argv) {
      if (!fs.existsSync(dir)) {
        return this.error(`Directory ${dir} does not exist`);
      }
      if (!fs.lstatSync(dir).isDirectory()) {
        return this.error(`${dir} is not directory`);
      }
    }
    for (const dir of argv) {
      cli.action.start(dir);
      // eslint-disable-next-line no-await-in-loop
      const contentType = await PearsonConverter.getType(dir);
      if (contentType === null) {
        cli.action.stop('unknown type');
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      await PearsonConverter.convert(dir, contentType);
      cli.action.stop(`converted (${contentType})`);
    }
    this.log('Complete!');
  }
}
