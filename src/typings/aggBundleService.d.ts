declare module '@aggregion/agg-bundle-service' {

  import * as Stream from 'stream';

  export function createReadStream(options: { path: string; encrypted: boolean; info: object; props: object }): Stream.Readable;

  export function createWriteStream(options: { path: string; encrypted: boolean }): Stream.Writable;
}
