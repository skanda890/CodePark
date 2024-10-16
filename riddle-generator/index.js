const language = require('@google-cloud/language');

async function generateRiddle(topic) {
  const client = new language.LanguageServiceClient();

  const document = {
    content: `Generate a riddle about a ${topic}`,
    type: 'PLAIN_TEXT',
  };

  try {
    const [response] = await client.generateText({
      model: 'text-bison-001', // or a suitable model
      documents: [document],
      temperature: 0.5, // Adjust for creativity (higher = more creative)
      maxOutputTokens: 100, // Adjust output length
    });

     // Extract and clean the riddle.  This part needs robust error handling
    // and potentially more sophisticated parsing based on the model's output.
    const riddleText = response.candidates[0].output.replace(/Answer:/i, '').trim();


    //  Find the answer.  This is a BIG assumption about the format.
    //  You'll need better logic to extract answers reliably.
    const answerStartIndex = riddleText.lastIndexOf('\n'); // Assumes answer on last line
    const riddle = riddleText.substring(0, answerStartIndex).trim();
    const answer = riddleText.substring(answerStartIndex).trim();


    return { riddle, answer };


  } catch (error) {
    console.error('Error generating riddle:', error);
    return null;
  }
}


async function main() {
  const topic = process.argv[2] || 'tree'; // Get topic from command line or default

  const riddleData = await generateRiddle(topic);

  if (riddleData) {
      console.log("Riddle:", riddleData.riddle);
      console.log("Answer:", riddleData.answer);


  }
}

main();
