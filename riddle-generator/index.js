const axios = require('axios');

async function generateRiddle(topic) {
    const modelId = "bigscience/bloomz-560m"; // Or another suitable Hugging Face model

    const prompt = `Generate a riddle about a ${topic}`;

    const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY || ''; // Get API key from environment variable

    const headers = {
        "Authorization": `Bearer ${huggingFaceApiKey}`, // Use API key in the header
        "Content-Type": "application/json",
    };

    const data = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.7,
            "max_new_tokens": 100,
        },
    };

    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${modelId}`,
            data,
            { headers: headers }
        );

        const generatedText = response.data[0].generated_text;

        // Extract riddle and answer (might need adjustment based on model output)
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

main();
