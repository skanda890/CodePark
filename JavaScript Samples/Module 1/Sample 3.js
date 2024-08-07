import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

export async function main() {
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const stream = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: "The capital of France is Paris." },
      { role: "user", content: "What about Spain?" },
      { role: "user", content: "Give me 5 good reasons why I should exercise every day." }
    ],
    model: modelName,
    stream: true // Enable streaming
  });

  for await (const part of stream) {
    process.stdout.write(part.choices[0]?.delta?.content || '');
  }
  process.stdout.write('\n');
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});