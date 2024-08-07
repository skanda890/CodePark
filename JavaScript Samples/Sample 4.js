import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

export async function main() {
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant that describes images in details." },
      { role: "user", content: [
          { type: "text", text: "What's in this image?" },
          { type: "image_url", image_url: {
              url: "https://cdn.pixabay.com/photo/2017/01/06/19/15/lamborghini-1954424_1280.jpg", details: "low" }
          }
        ]
      }
    ],
    model: modelName
  });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});