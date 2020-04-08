import {Command, flags} from '@oclif/command';
import * as BundleService from '@aggregion/agg-bundle-service';

export default class MakeCommand extends Command {
  static description = 'Create Aggregion bundles from directory';

  static usage = 'make dir -o <output_file>';

  static strict = true;

  static flags = {
    output: flags.string({
      char: 'o',
      required: true,
      description: 'Output bundle file',
    }),
    index: flags.string({
      char: 'i',
      default: 'index.html',
      description: 'Index file',
    }),
  };

  static args = [
    {
      name: 'input',
      required: true,
      description: 'Directory or file to bundle',
    },
  ];

  async run() {
    const {argv, flags} = this.parse(MakeCommand);
    const dir = argv[0];
    const rs = BundleService.createReadStream({path: dir, encrypted: false, info: {}, props: {main_file: flags.index}});
    const ws = BundleService.createWriteStream({path: flags.output, encrypted: false});
    await new Promise((resolve, reject) => {
      ws.on('finish', () => {
        resolve();
      });
      ws.on('error', (e: any) => {
        reject(e);
      });
      rs.on('error', (e: any) => {
        reject(e);
      });
      rs.pipe(ws);
    });
    this.log('Done!');
  }
}
