const questionForm = document.getElementById('questionForm');
const roleInput = document.getElementById('roleInput');
const generateBtn = document.getElementById('generateBtn');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');
const resultsTitle = document.getElementById('resultsTitle');
const questionList = document.getElementById('questionList');

const API_KEY = "AIzaSyAALMyghIWgYdjjpy5tclfwRDQds5lz7Xs"; 

questionForm.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const role = roleInput.value.trim();
    
    if (!role) {
        showError('Please enter a job role');
        return;
    }
    
    setLoading(true);
    hideError();
    
    try {
        const questions = await generateQuestions(role);
        displayQuestions(questions, role);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate questions. Please try again.');
    } finally {
        setLoading(false);
    }
}

async function generateQuestions(role) {
    const prompt = `Generate 10 challenging and relevant interview questions for a ${role} position. 
    Focus on technical skills, problem-solving abilities, and experience-based questions. 
    Format the response as a JSON array of strings containing only the questions.`;
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        }
    );
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to generate questions');
    }
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    let questions;
    try {
        if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
            questions = JSON.parse(text);
        } else {
            questions = text
                .split('\n')
                .filter(line => line.trim().length > 0 && !line.includes('```'))
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(line => line.length > 10 && line.includes('?'));
        }
    } catch (error) {
        console.error('Error parsing questions:', error);
        questions = text
            .split(/\d+\.\s+/)
            .filter(q => q.trim().length > 10)
            .map(q => q.trim());
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Failed to parse questions from API response');
    }
    
    return questions;
}

// Display questions in the UI
function displayQuestions(questions, role) {
    // Clear previous questions
    questionList.innerHTML = '';
    
    // Update title
    resultsTitle.textContent = `Interview Questions for ${role}`;
    
    // Add each question to the list
    questions.forEach((question, index) => {
        const li = document.createElement('li');
        li.className = 'question-item';
        
        const span = document.createElement('span');
        span.className = 'question-number';
        span.textContent = `Q${index + 1}:`;
        
        li.appendChild(span);
        li.appendChild(document.createTextNode(' ' + question));
        
        questionList.appendChild(li);
    });
    
    // Show results
    results.style.display = 'block';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="spinner"></div> Generating...';
    } else {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Interview Questions';
    }
}

// Initialize
function init() {
    console.log('Interview Question Generator initialized');
}

// Run initialization
init();