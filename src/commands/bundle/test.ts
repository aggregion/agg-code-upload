import {Command} from '@oclif/command';
import StaticServer from '../../common/staticServer/staticServer';
import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as open from 'open';

interface DialogResult {
  isOk: boolean;
}

export default class TestCommand extends Command {
  private static _defaultPort = 8888;

  static description = 'Test content in browser';

  static usage = 'test [dir1] [dir2] [...] [dirN]';

  static strict = false;

  static args = [
    {
      name: 'dirs',
      required: true,
      description: 'List of directories',
    },
  ];

  async run() {
    const {argv} = this.parse(TestCommand);
    const dirs = argv.filter(dir => fs.existsSync(dir) && fs.lstatSync(dir).isDirectory());
    for (const dir of dirs) {
      const server = new StaticServer(dir, TestCommand._defaultPort);
      // eslint-disable-next-line no-await-in-loop
      await server.start();
      // eslint-disable-next-line no-await-in-loop
      await open(`http://localhost:${TestCommand._defaultPort}`);
      // eslint-disable-next-line no-await-in-loop
      await inquirer.prompt<DialogResult>([
        {
          type: 'confirm',
          name: 'isOk',
          message: `Checking "${dir}". Is it look like working fine?`,
        },
      ]);
      // eslint-disable-next-line no-await-in-loop
      await server.stop();
    }
  }
}
