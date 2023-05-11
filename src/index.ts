// dotenvとfsをimportする
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// openaiとcsv-parse、csv-stringifyからConfigurationとOpenAIApi、parse、stringifyをimportする
import { Configuration, OpenAIApi } from 'openai';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';

// dotenvを設定する
dotenv.config();

// Configurationオブジェクトを作成し、openaiに渡すAPIキーを設定する
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

// OpenAIApiオブジェクトを作成する
const openai = new OpenAIApi(configuration);

// 指定されたファイルを読み込み、Promiseを返す関数を定義する
const readCsvFile = (
  filePath: string
): Promise<
  Array<{ Handle: string; Title: string; Body: string; 'Image Src': string }>
> => {
  return new Promise((resolve, reject) => {
    // 指定されたファイルを非同期で読み込む
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // エラーが発生した場合はrejectする
        reject(err);
      } else {
        // csv-parseを使って、CSVデータをパースする
        const parser = parse(data, { columns: true }, (parseErr, records) => {
          if (parseErr) {
            // エラーが発生した場合はrejectする
            reject(parseErr);
          } else {
            // パースされたデータをresolveする
            resolve(records);
          }
        });
        // csv-parseのエラーをキャッチする
        parser.on('error', (parseErr) => reject(parseErr));
      }
    });
  });
};

// 指定されたファイルにデータを書き込み、Promiseを返す関数を定義する
const writeCsvFile = (filePath: string, records: any[]) => {
  return new Promise((resolve, reject) => {
    // csv-stringifyを使って、データをCSV形式に変換する
    const stringifier = stringify(records, { header: true });
    // 指定されたファイルにデータを書き込む
    const writable = fs.createWriteStream(filePath);
    writable.on('error', (err) => reject(err));
    writable.on('finish', () => resolve(void 0));
    stringifier.pipe(writable);
  });
};

// HTMLタグを除去する関数を定義する
const stripHtmlTags = (html: string) => {
  return html.replace(/<[^>]*>?|<!--.*?-->/gm, '');
};

// メインの処理を行う関数を定義する
const main = async () => {
  // input/products.csvからデータを読み込む
  const records = await readCsvFile('input/products.csv');
  const data = [];
  for (const record of records) {
    // タイトルと本文からHTMLタグを除去し、テキストを作成する
    const text = `${record.Title} ${stripHtmlTags(record.Body)}`;
    // OpenAIのAPIを使って、テキストのベクトルを作成する
    const res = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text,
    });
    const vector = res.data.data[0].embedding;
    // データを配列に追加する
    data.push({
      handle: record.Handle,
      title: record.Title,
      body: stripHtmlTags(record.Body),
      imageSrc: record['Image Src'],
      vector,
    });
  }
  // output/data.csvにデータを書き込む
  await writeCsvFile('output/data.csv', data);
};

// main関数を実行する
main().catch((err) => console.error(err));
