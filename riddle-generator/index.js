// index.js
const axios = require('axios');

async function generateRiddle(topic) {
    const modelId = "bigscience/bloomz-560m"; // Replace with a suitable Hugging Face model ID

    const prompt = `Generate a riddle about a ${topic}`;

    const headers = {
        "Authorization": `Bearer ${huggingFaceApiKey}`, // Replace with your Hugging Face API key (optional)
        "Content-Type": "application/json",
    };

    const data = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.7, // Adjust for creativity
            "max_new_tokens": 100, // Adjust length
        },
    };

    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${modelId}`,
            data,
            { headers: headers }
        );

        const generatedText = response.data[0].generated_text;

        // (Extract the riddle and answer - the logic might need to be adjusted 
        // based on the specific model's output format)
        const riddleText = generatedText.replace(/Answer:/i, '').trim();
        const answerStartIndex = riddleText.lastIndexOf('\n'); 
        const riddle = riddleText.substring(0, answerStartIndex).trim();
        const answer = riddleText.substring(answerStartIndex).trim();


        return { riddle, answer };
    } catch (error) {
        console.error('Error generating riddle:', error);
        return null;
    }
}


async function main() {
    const topic = process.argv[2] || 'tree';

    const riddleData = await generateRiddle(topic);

    if (riddleData) {
        console.log("Riddle:", riddleData.riddle);
        console.log("Answer:", riddleData.answer);
    }
}

// Get a Hugging Face API key (optional but recommended for higher rate limits)
const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY || ''; // Set in environment variables

main();
