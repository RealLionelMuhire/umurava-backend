require('dotenv').config();
console.log("Key is:", process.env.GEMINI_API_KEY);
console.log("Length is:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
