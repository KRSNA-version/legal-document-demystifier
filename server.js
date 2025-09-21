// server.js (Complete and Updated Final Code)

// 1. IMPORT DEPENDENCIES
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. INITIALIZE APP & SERVICES
const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// 3. MIDDLEWARE SETUP
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('public')); // Middleware to serve static files

// 4. THE CORE API ROUTE
app.post('/analyze', upload.single('document'), async (req, res) => {
    try {
        let legalText = '';

        // Check if a file was uploaded
        if (req.file) {
            const buffer = req.file.buffer;
            if (req.file.mimetype === 'application/pdf') {
                const data = await pdf(buffer);
                legalText = data.text;
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const { value } = await mammoth.extractRawText({ buffer });
                legalText = value;
            } else {
                return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX.' });
            }
        }
        // If no file, check if text was sent in the body
        else if (req.body.legalText) {
            legalText = req.body.legalText;
        }
        // If neither is present, it's an error
        else {
            return res.status(400).json({ error: 'No document or text was provided.' });
        }
        
        if (!legalText) {
             return res.status(500).json({ error: 'Could not extract text from the input.' });
        }

        // --- The Gemini API call logic ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `
            You are an expert legal assistant AI. Your job is to demystify complex legal documents for the average person.
            Do NOT provide legal advice. Always identify the language in which the user is asking, reponse him/her in his preffered language or the language in which the input text is coming okay, if he uploads a text in hindi then reply inn Hindi and, Always start your response with a clear disclaimer: "**Disclaimer:** This is an AI analysis and not legal advice. Consult a qualified legal professional."
            Analyze the following legal text:

            ---
            ${legalText}
            ---

            Provide your analysis in the following structured markdown format:

            ### 📝 Plain English Summary
            Provide a concise, easy-to-understand summary of the document's main purpose.

            ### 🔑 Key Clauses Explained
            Identify and explain 3-4 of the most important or potentially confusing clauses. Explain what they mean in simple terms.

            ### 🚩 Potential Red Flags
            Highlight any clauses that could be risky, unusual, or heavily one-sided. Explain the risk clearly.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();

        res.json({ analysis: analysisText });

    } catch (error) {
        console.error('Error during analysis:', error);
        res.status(500).json({ error: 'An internal server error occurred during analysis.' });
    }
});

// 5. START THE SERVER
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});
