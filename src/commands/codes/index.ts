import {Command} from '@oclif/command';

export default class CodesCommands extends Command {
  static description = 'Working with distribution codes';

  run(): PromiseLike<any> {
    return Promise.resolve();
  }
}
