import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_if_not_provided');

export const analyzeIncidentWithGemini = async (newIncident, existingIncidents) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Skipping AI analysis.");
      return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
    You are a seasoned human emergency dispatcher working in a high-stress Disaster Response Center. You speak with authority, brevity, and urgency. Do NOT sound like an AI. Do NOT use phrases like "Based on the provided information", "As an AI", or "I recommend".
    A user just reported a new incident:
    Title: "${newIncident.title}"
    Description: "${newIncident.description}"
    Location: "${newIncident.locationName}"
    Category: "${newIncident.category}"

    Here is a list of other active incidents currently in the system:
    ${existingIncidents.map(inc => `- [ID: ${inc._id}] ${inc.title} at ${inc.locationName} (${inc.category})`).join('\n')}

    Please analyze this new report and return a JSON object with the following structure:
    {
      "isDuplicate": boolean, // true if this seems to be reporting the exact same event as an existing incident in the same location
      "duplicateOfId": string | null, // the ID of the existing incident it is a duplicate of, or null
      "suggestedCategory": string, // One of: 'Flood', 'Fire', 'Earthquake', 'Storm', 'Landslide', 'Medical Emergency', 'Infrastructure Failure', 'Other'
      "suggestedSeverity": string, // One of: 'low', 'medium', 'high', 'critical'
      "latitude": number, // Generate a best-guess numerical latitude for this locationName (bias towards India if ambiguous)
      "longitude": number, // Generate a best-guess numerical longitude for this locationName (bias towards India if ambiguous)
      "suggestedResources": [
        { "category": "category string", "quantity": number, "rationale": "Why they need this" }
      ],
      // IMPORTANT: suggestedResources category MUST be one of: 'Medical supplies', 'Food and water', 'Shelter supplies', 'Rescue equipment', 'Transportation', 'Personnel'
      "rationale": "A brief explanation of your analysis. Write like a human analyst. Keep it punchy and direct.",
      "recommendedAction": "A short, actionable sentence suggesting the immediate next step rescuers should take to speed up the process. Write it as a direct order from a dispatcher (e.g. 'Deploy heavy rescue teams to sector 4 immediately').",
      "networkStatus": "string" // Estimate local cell network status based on the disaster severity and location. e.g. 'Optimal', 'Degraded', 'Offline', 'Unknown'
    }
    
    Make sure to only output valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null; // Gracefully fallback if AI fails
  }
};

export const generateActionPlanWithGemini = async (incident) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
    You are the Chief Emergency Response Coordinator. You speak with authority, brevity, and extreme urgency. Do NOT sound like an AI. Do NOT use filler words.
    Provide an immediate action plan for the following disaster incident:
    Title: "${incident.title}"
    Category: "${incident.category}"
    Severity: "${incident.severity}"
    Location: "${incident.locationName}"
    Description: "${incident.description}"

    Provide your response as a JSON object with this exact structure:
    {
      "nextSteps": [
        "Step 1...",
        "Step 2..."
      ],
      "emergencyContacts": [
        { "name": "Local Fire Dept / EMS", "number": "911 / 112" },
        { "name": "Organization X", "number": "Phone number" }
      ],
      "warnings": [
        "Warning 1..."
      ]
    }
    Make sure to only output valid JSON. Do not include markdown formatting or backticks.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Action Plan failed:", error);
    throw new Error("Failed to generate AI action plan");
  }
};

export const generateGlobalOverviewWithGemini = async (incidents) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
    You are the Chief of Operations at the national disaster center. You are briefing your team. You speak with authority, brevity, and urgency. Do NOT sound like an AI.
    Review the following active incidents currently ongoing:
    ${incidents.map(inc => `- [${inc.severity.toUpperCase()}] ${inc.title} at ${inc.locationName} (${inc.category}) (Affected: ${inc.peopleAffected || 'Unknown'})`).join('\n')}

    1. Provide a concise, 1-2 sentence recommendation for the operations center on the MOST IMPORTANT action to take right now to speed up the overall rescue process across all incidents. 
    Focus on resource allocation, prioritizing the most critical incidents, or a general operational strategy. Write it as a direct command (e.g., 'Divert all med-evac choppers to the east coast immediately.').
    Additionally, provide 1 brief sentence at the end suggesting general emergency contacts or relevant weather safety warnings if applicable.
    
    2. Provide a specific 1-sentence action suggestion for each severity level (Critical, High, Medium, Low) based on the emergency need and number of people affected in the incidents of that level. Write them as direct dispatcher orders.

    Provide your response as a JSON object with this exact structure:
    {
      "globalSuggestion": "Your concise recommendation here",
      "levelSuggestions": {
        "Critical": "Suggestion for Critical incidents...",
        "High": "Suggestion for High incidents...",
        "Medium": "Suggestion for Medium incidents...",
        "Low": "Suggestion for Low incidents..."
      }
    }
    Make sure to only output valid JSON. Do not include markdown formatting or backticks.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Global Overview failed:", error);
    // Include a helpful hardcoded fallback so the user always sees a suggestion, even if API is 503 overloaded
    return { 
      globalSuggestion: "High priority: allocate immediate medical resources to Critical severity incidents. Ensure all field units have emergency channels (911/112) active, and monitor local weather conditions before dispatching further teams.",
      levelSuggestions: {
        "Critical": "Deploy immediate life-saving medical and rescue teams.",
        "High": "Dispatch rapid response units and secure the perimeter.",
        "Medium": "Monitor situation and allocate secondary resources.",
        "Low": "Follow standard operating procedures and log updates."
      }
    };
  }
};
