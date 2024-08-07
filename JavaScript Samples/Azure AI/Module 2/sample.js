import ModelClient from "@azure-rest/ai-inference";
import { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "text-embedding-3-large";

export async function main() {

  const client = new ModelClient(endpoint, new AzureKeyCredential(token));

  const response = await client.path("/embeddings").post({
    body: {
      input: ["first phrase", "second phrase", "third phrase"],
      model: modelName
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  for (const item of response.body.data) {
    let length = item.embedding.length;
    console.log(
	  `data[${item.index}]: length=${length}, ` +
	  `[${item.embedding[0]}, ${item.embedding[1]}, ` +
	  `..., ${item.embedding[length - 2]}, ${item.embedding[length -1]}]`);
  }
  console.log(response.body.usage);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
