import { OpenAIApi, Configuration } from "openai-edge";
import { v4 as uuidv4 } from 'uuid';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function getEmbeddings(input: string, timestamp: number) {
  try {
    const cleanedInput = input
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/(\r\n|\n|\r){2,}/g, '\n\n')
      .replace(/[^\w\s.,?!-]/g, '')
      .trim();

    const response = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: cleanedInput
    });

    const result = await response.json();
    const embedding = result.data[0].embedding as number[];

    return {
      id: uuidv4(),
      values: embedding,
      metadata: JSON.stringify({
        text: cleanedInput,
        timestamp: timestamp
      })
    };
  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}