import * as http from 'http';
import * as serveStatic from 'serve-static';
import * as finalHandler from 'finalhandler';

export default class StaticServer {
  private readonly _dir: string;

  private readonly _port: number;

  private _server: any;

  constructor(dir: string, port = 8888) {
    this._dir = dir;
    this._port = port;
  }

  async start() {
    if (this._server) {
      return;
    }
    this._server = http.createServer((req, res) => {
      const serve = serveStatic(this._dir);
      serve(req as any, res as any, finalHandler(req, res));
    });
    return new Promise((resolve, reject) => {
      this._server.listen(this._port, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  async stop() {
    if (!this._server) {
      return;
    }
    const server = this._server;
    this._server = null;
    return new Promise(resolve => {
      server.close(resolve);
    });
  }
}
