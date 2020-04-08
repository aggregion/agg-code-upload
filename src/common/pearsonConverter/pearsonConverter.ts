import * as fs from 'fs-extra';
import * as path from 'path';
import * as readdir from 'recursive-readdir';
import * as handlebars from 'handlebars';
import * as xml2js from 'xml2js';

enum ContentType {
  ATDefault = 'Active Teach',
  ATMitLinks = 'Active Teach (MitLinks)',
  NEA = 'NEA',
  DEProtected = 'DE (protected)',
  DEOpen = 'DE'
}

export default class PearsonConverter {
  static async getType(contentPath: string): Promise<ContentType | null> {
    if (fs.existsSync(path.join(contentPath, './xml/navigation.xml'))) {
      const data = fs.readFileSync(path.join(contentPath, './xml/navigation.xml'), 'utf8');
      const obj = await xml2js.parseStringPromise(data);
      if (obj.data) {
        return ContentType.DEProtected;
      }
      if (obj.navigation) {
        return ContentType.DEOpen;
      }
    }

    if (fs.existsSync(path.join(contentPath, './data/xml/bookinfo.xml'))) {
      return ContentType.NEA;
    }
    if (fs.existsSync(path.join(contentPath, './data/main.swf'))) {
      return ContentType.ATDefault;
    }
    if (fs.existsSync(path.join(contentPath, './bin/main.swf'))) {
      return ContentType.ATMitLinks;
    }
    return null;
  }

  static convert(dir: string, contentType: ContentType): Promise<void> {
    switch (contentType) {
    case ContentType.DEProtected:
      return this.convertDE(dir, true);
    case ContentType.DEOpen:
      return this.convertDE(dir, false);
    case ContentType.ATDefault:
      return this.convertAT(dir, 'default');
    case ContentType.ATMitLinks:
      return this.convertAT(dir, 'mitLinks');
    case ContentType.NEA:
      return this.convertNEA(dir);
    default:
      throw new Error(`Unsupported type: ${contentType}`);
    }
  }

  private static convertDE(dir: string, isProtected: boolean): Promise<void> {
    const filesToCopyPath = path.join(__dirname, './data/dataDE/');
    fs.copySync(filesToCopyPath, dir);
    if (isProtected) {
      fs.copySync(path.join(__dirname, './data/dataDEProtected/'), dir);
    }
    return Promise.resolve();
  }

  private static convertNEA(dir: string): Promise<void> {
    const filesToCopyPath = path.join(__dirname, './data/dataNEA/');
    fs.copySync(filesToCopyPath, dir);
    return Promise.resolve();
  }

  private static convertAT(dir: string, loaderType: string): Promise<void> {
    const ignoreFunc = (file: any, stats: any) => {
      if (stats.isDirectory()) {
        return false;
      }
      const fileName = path.basename(file);
      return !fileName.toLowerCase().endsWith('.swf');
    };
    const filesToCopyPath = path.join(__dirname, './data/dataAT/toCopy/');
    fs.copySync(filesToCopyPath, dir);
    const template = handlebars.compile(fs.readFileSync(path.join(__dirname, './data/dataAT/content.hbs'), 'utf8'));
    return new Promise((resolve, reject) => {
      readdir(dir, [ignoreFunc], (err, files) => {
        if (err) {
          return reject(err);
        }
        try {
          files.forEach(f => {
            const pathToRoot = path.relative(f, dir);
            const innerSwf = path.basename(f);
            const swfHtml = innerSwf + '.html';
            const swfHtmlPath = path.join(path.dirname(f), swfHtml);
            const html = template({pathToRoot, innerSwf, mainSwf: innerSwf, isMain: false, loaderType});
            fs.writeFileSync(swfHtmlPath, html, 'utf8');
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).then(() => {
      const pathToRoot = '.';
      const mainSwf = 'PearsonContentLoader.swf';
      const innerSwf = loaderType === 'mitLinks' ? './bin/main.swf' : './data/main.swf';
      const html = template({pathToRoot, mainSwf, innerSwf, isMain: true, loaderType});
      const indexHtmlPath = path.join(dir, 'index.html');
      fs.writeFileSync(indexHtmlPath, html, 'utf8');
    });
  }
}
