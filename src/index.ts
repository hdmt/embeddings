import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(configuration);

const readCsvFile = (
  filePath: string
): Promise<
  Array<{ Handle: string; Title: string; Body: string; 'Image Src': string }>
> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const parser = parse(data, { columns: true }, (parseErr, records) => {
          if (parseErr) {
            reject(parseErr);
          } else {
            resolve(records);
          }
        });
        parser.on('error', (parseErr) => reject(parseErr));
      }
    });
  });
};

const writeCsvFile = (filePath: string, records: any[]) => {
  return new Promise((resolve, reject) => {
    const stringifier = stringify(records, { header: true });
    const writable = fs.createWriteStream(filePath);
    writable.on('error', (err) => reject(err));
    writable.on('finish', () => resolve(void 0));
    stringifier.pipe(writable);
  });
};

const stripHtmlTags = (html: string) => {
  return html.replace(/<[^>]*>?|<!--.*?-->/gm, '');
};

const main = async () => {
  const records = await readCsvFile('input/products.csv');
  const data = [];
  for (const record of records) {
    const text = `${record.Title} ${stripHtmlTags(record.Body)}`;
    const res = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text,
    });
    const vector = res.data.data[0].embedding;
    data.push({
      handle: record.Handle,
      title: record.Title,
      body: stripHtmlTags(record.Body),
      imageSrc: record['Image Src'],
      vector,
    });
  }
  await writeCsvFile('output/data.csv', data);
};

main().catch((err) => console.error(err));
