// script.js (UPDATED FULL CODE)

// script.js (CORRECTED AND FINAL VERSION)

document.addEventListener('DOMContentLoaded', () => {
    // === Block 1: Get references to ALL elements ===
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const fileNameSpan = document.getElementById('fileName');
    const resultsContainer = document.getElementById('resultsContainer');
    const loader = document.getElementById('loader');

    const uploadTabBtn = document.getElementById('uploadTabBtn');
    const pasteTabBtn = document.getElementById('pasteTabBtn');
    const uploadContainer = document.getElementById('uploadContainer');
    const pasteContainer = document.getElementById('pasteContainer');
    const textInput = document.getElementById('textInput');

    // This variable is key. It will track which mode we are in.
    let currentMode = 'upload'; 

    // === Block 2: Tab Switching Logic ===
    uploadTabBtn.addEventListener('click', () => {
        currentMode = 'upload'; // Set the mode
        uploadContainer.classList.remove('hidden');
        pasteContainer.classList.add('hidden');
        uploadTabBtn.classList.add('active');
        pasteTabBtn.classList.remove('active');
    });

    pasteTabBtn.addEventListener('click', () => {
        currentMode = 'paste'; // Set the mode
        pasteContainer.classList.remove('hidden');
        uploadContainer.classList.add('hidden');
        pasteTabBtn.classList.add('active');
        uploadTabBtn.classList.remove('active');
    });

    // === Block 3: Existing logic for file input UI ===
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        fileNameSpan.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file selected';
    });

    // === Block 4: The CORRECTED main analyze logic ===
    analyzeBtn.addEventListener('click', async () => {
        let fetchBody;
        let fetchHeaders = {};

        // A) Correctly check which mode is active
        if (currentMode === 'upload') {
            const file = fileInput.files[0];
            if (!file) {
                // This is the error you were seeing.
                alert('Please select a .pdf or .docx file to analyze.');
                return;
            }
            const formData = new FormData();
            formData.append('document', file);
            fetchBody = formData;
            // No headers needed for FormData, browser sets it.
        } else if (currentMode === 'paste') {
            const text = textInput.value;
            if (!text.trim()) {
                alert('Please paste some text to analyze.');
                return;
            }
            fetchBody = JSON.stringify({ legalText: text });
            fetchHeaders['Content-Type'] = 'application/json';
        } else {
            // A fallback error in case something goes wrong
            alert('An unknown error occurred. Please refresh the page.');
            return;
        }

        // B) Show loading state (no change here)
        resultsContainer.innerHTML = '';
        loader.classList.remove('hidden');
        resultsContainer.appendChild(loader);

        // C) The fetch call (no change here)
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: fetchHeaders,
                body: fetchBody,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown server error occurred.');
            }

            const data = await response.json();
            
            // D) Displaying results (no change here)
            let formattedHtml = data.analysis
                .replace(/### (.*)/g, '<h3>$1</h3>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');

            resultsContainer.innerHTML = formattedHtml;

        } catch (error) {
            console.error('Fetch Error:', error);
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            loader.classList.add('hidden');
        }
    });
});
