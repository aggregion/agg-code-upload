import {Command} from '@oclif/command';
import Api from '../../common/api';
import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as ora from 'ora';
import {Code, PromoCampaign} from '../../common/api/market/promoCampaigns';

interface PromoData {
  promoCampaign: PromoCampaign;
}

interface ParamsData {
  selectSpecificGoods: boolean;
}

interface ChosenGoodsData {
  goods: string[];
}

export default class UploadCommand extends Command {
  static description = 'Upload codes';

  static usage = 'upload -f <file_with_codes>';

  static strict = true;

  static args = [
    {
      name: 'file',
      required: true,
      description: 'List of codes',
    },
  ];

  async run() {
    const {args} = this.parse(UploadCommand);

    if (!fs.existsSync(args.file)) {
      return this.error(`File "${args.file}" does not exist`);
    }

    const data = fs.readFileSync(args.file, 'utf8');
    const codes = data.split('\n').map(line => line.trim()).map(code => {
      if (code.startsWith('PEARSON')) {
        return code;
      }
      return 'PEARSON-' + code;
    });

    const api = new Api();
    const promoCampaigns = await api.Market.PromoCampaigns.getPromoCampaigns();
    if (promoCampaigns.length === 0) {
      return this.log('This account has no distributions');
    }
    const promoData = await inquirer.prompt<PromoData>([
      {
        type: 'list',
        name: 'promoCampaign',
        message: 'Select distribution',
        choices: promoCampaigns.map(a => ({name: a.name, value: a})),
      },
    ]);

    const promo: PromoCampaign = promoData.promoCampaign;

    const goods = promo.goods;

    if (goods.length === 0) {
      return this.log('Distribution has no goods');
    }

    const paramsData = await inquirer.prompt<ParamsData>([
      {
        type: 'confirm',
        name: 'selectSpecificGoods',
        message: 'Do you want to select specific goods?',
        default: false,
      },
    ]);

    let forcedChosenGoods: string[] = [];

    if (paramsData.selectSpecificGoods) {
      const goodsData = await inquirer.prompt<ChosenGoodsData>([
        {
          type: 'checkbox',
          message: 'Select goods',
          name: 'goods',
          choices: goods.map(g => ({name: g.catalog.title.default, value: g.id})),
          validate: input => {
            if (input.length === 0) {
              return 'Please select at least one item';
            }
            return true;
          },
        },
      ]);
      forcedChosenGoods = goodsData.goods;
    }

    const codesForUpload: Code[] = codes.map(c => ({
      type: 'promoCampaign',
      code: c,
      link: {
        promoCampaign: promo.id,
      },
      forcedChosenGoods,
    }));

    const spinner = ora('Uploading...').start();
    await api.Market.PromoCampaigns.uploadCodes(codesForUpload);
    spinner.stop();
    this.log('Done!');
  }
}
