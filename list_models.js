const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy init to get client
        // The SDK doesn't expose listModels directly easily on the instance, 
        // but usually we can try a known valid model or check docs.
        // Actually, let's try a simple generation strictly with gemini-pro to see if key works
        // and print error if model not found.

        // Better approach: Test common model names
        const modelsToTest = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro-latest", "gemini-1.0-pro"];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent("Hello");
                console.log(`✅ ${modelName} WORKED!`);
                console.log(result.response.text());
                break; // Found one!
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
