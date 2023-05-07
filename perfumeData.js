require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 閾値を設定（0-2）
const threshold = 0.5;

// 5つの香水ブランドと商品説明文のデータ
const perfumeData = [
  {
    brand: 'Brand シトラス',
    description: 'This perfume has a fresh シトラス',
  },
  {
    brand: 'Brand B',
    description:
      'This fragrance is perfect for women who love floral scents...',
  },
  {
    brand: 'Brand C',
    description: 'A classic masculine scent with a dry and woody aroma...',
  },
  {
    brand: 'Brand D',
    description: 'This unisex perfume combines spicy and sweet notes...',
  },
  {
    brand: 'Brand E',
    description:
      "This women's perfume is light and fruity with hints of jasmine...",
  },
  {
    brand: 'Brand 鉄',
    description: 'これは鉄の匂いのする香水です',
  },
];

async function findClosestPerfume(keyword) {
  try {
    // 香水データをEmbedding
    const perfumeEmbeddings = [];
    for (const perfume of perfumeData) {
      const response = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: perfume.description,
      });
      //   console.log(response.data);
      // Ensure the response contains the expected data
      if (
        response.data &&
        response.data.data &&
        response.data.data[0] &&
        response.data.data[0].embedding
      ) {
        perfumeEmbeddings.push({
          brand: perfume.brand,
          embedding: response.data.data[0].embedding,
        });
      } else {
        throw new Error('Invalid response  #1');
      }
    }

    // console.log(perfumeEmbeddings);

    // キーワードをEmbedding
    const keywordResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: keyword,
    });

    // console.log(keywordResponse.data);

    let keywordEmbedding;
    // Ensure the response contains the expected data
    if (
      keywordResponse.data.data &&
      keywordResponse.data.data[0] &&
      keywordResponse.data.data[0].embedding
    ) {
      keywordEmbedding = keywordResponse.data.data[0].embedding;
    } else {
      throw new Error('Invalid response  #2');
    }

    console.log(keywordEmbedding);

    // 最も近い香水ブランドを見つける
    let closestPerfume = null;
    let minDistance = Infinity;
    for (const perfumeEmbedding of perfumeEmbeddings) {
      const distance = calculateDistance(
        keywordEmbedding,
        perfumeEmbedding.embedding
      );
      console.log(perfumeEmbedding.brand);
      console.log(distance);
      if (distance < minDistance) {
        minDistance = distance;
        closestPerfume = perfumeEmbedding.brand;
      }
    }

    // 最も近い香水ブランドを表示する
    console.log(
      `The closest perfume to the keyword "${keyword}" is: ${closestPerfume}`
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

// ２つのベクトル間のコサイン類似度の逆数を計算する関数
function calculateDistance(vector1, vector2) {
  const dotProduct = vector1.reduce(
    (sum, value, index) => sum + value * vector2[index],
    0
  );
  const magnitude1 = Math.sqrt(
    vector1.reduce((sum, value) => sum + Math.pow(value, 2), 0)
  );
  const magnitude2 = Math.sqrt(
    vector2.reduce((sum, value) => sum + Math.pow(value, 2), 0)
  );

  const cosineSimilarity = dotProduct / (magnitude1 * magnitude2);
  const cosineDistance = 1 - cosineSimilarity;

  return cosineDistance;
}

// キーワードを指定して関数を実行
const keyword = 'シトラス';
findClosestPerfume(keyword);
