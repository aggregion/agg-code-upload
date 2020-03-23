import {Command} from '@oclif/command';
import * as inquirer from 'inquirer';
import Api from '../common/api';
import * as ora from 'ora';

interface LoginData {
  login: string;
  password: string;
}

interface AccountData {
  account: string;
}

export default class LoginCommand extends Command {
  static description = 'Login to Aggregion';

  async run() {
    const data = await inquirer.prompt<LoginData>([
      {
        type: 'input',
        name: 'login',
        message: 'Enter your Aggregion login',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password',
      },
    ]);

    const api = new Api();

    const spinner = ora('Loading...').start();
    const loginResult = await api.login(data.login, data.password);
    await api.saveCredentials(loginResult);
    const accounts = await api.getAccounts();
    spinner.stop();

    const accountData = await inquirer.prompt<AccountData>([
      {
        type: 'list',
        name: 'account',
        message: 'Select account',
        choices: accounts.map(a => ({name: a.name, value: a.id})),
      },
    ]);

    await api.saveCredentials({...loginResult, account: accountData.account});
  }
}
