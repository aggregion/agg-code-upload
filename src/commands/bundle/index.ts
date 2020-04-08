import {Command} from '@oclif/command';

export default class CodesCommands extends Command {
  static description = 'Working on content bundles';

  run(): PromiseLike<any> {
    return Promise.resolve();
  }
}
