require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const main = async () => {
  const res = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: 'The food was delicious and the waiter...',
  });
  console.log(res.data.data);
};

main();
