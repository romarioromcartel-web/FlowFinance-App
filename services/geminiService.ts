

import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { Transaction, Wallet } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are FlowAI, a friendly and expert financial assistant living inside the FlowFinance app.
Your mission is to help the user track expenses, understand their money, and manage their budget with ease.

**Capabilities:**
1.  **Add Transactions:** You can add income or expenses to any wallet (Bank, Mobile Money, Cash, etc.) when the user asks (e.g., "I spent $50 on food").
2.  **Report & Summarize:** You can fetch transaction history to give daily, monthly, or yearly summaries using the \`getTransactions\` tool.
3.  **Detect Errors:** You check for potential duplicates before adding transactions.
4.  **Advise:** You provide simple, actionable financial tips based on the user's spending patterns.

**Personality & Tone:**
-   **Natural & Friendly:** Speak like a helpful human assistant, not a robot. Use "I", "we", and casual but professional language.
-   **Simple & Clear:** Avoid overly complex financial jargon unless necessary. Be concise.
-   **Adaptive:** Respond in the SAME language the user is speaking or the language specified in the context.

**Data Rules:**
-   **Real Data Only:** NEVER guess balances or transaction history. ALWAYS call \`getWallets\` or \`getTransactions\` to see reality.
-   **Formatting:** Use Markdown. Use **bold** for amounts and important terms. Use lists for summaries.
-   **Dates:** Tools expect ISO 8601 (YYYY-MM-DD). If the user says "today" or "yesterday", calculate the date based on the "Current Context" provided to you.

**Workflow:**
-   If asked "How much did I spend on Food?", CALL \`getTransactions({ category: 'Food' })\`, then summarize the result.
-   If asked "Add $10 for Taxi", CALL \`addTransaction\`.
-   If the wallet is not clear, ask the user to clarify (e.g., "Which wallet should I use? Cash or Bank?").
`;

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  zh: 'Chinese (Simplified)',
  hi: 'Hindi',
  ar: 'Arabic',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese'
};

// --- Tool Definitions ---

const addTransactionTool: FunctionDeclaration = {
  name: 'addTransaction',
  description: 'Adds a new financial transaction. Handles duplicates automatically.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'Description (e.g., "Lunch", "Salary")' },
      amount: { type: Type.NUMBER, description: 'Numeric amount.' },
      type: { type: Type.STRING, enum: ['EXPENSE', 'INCOME'], description: 'Transaction type.' },
      category: { type: Type.STRING, description: 'Category (Food, Transport, Salary, etc.).' },
      walletName: { type: Type.STRING, description: 'Name of the wallet (e.g., "Orabank", "Cash").' },
      date: { type: Type.STRING, description: 'ISO Date string (YYYY-MM-DD). If user says "yesterday", calculate it based on today.' }
    },
    required: ['description', 'amount', 'type', 'category']
  }
};

const getWalletsTool: FunctionDeclaration = {
  name: 'getWallets',
  description: 'Retrieves the list of all user wallets and their current balances.',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No params needed
  }
};

const getTransactionsTool: FunctionDeclaration = {
  name: 'getTransactions',
  description: 'Retrieves a list of transactions based on filters. Use this for summaries.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      startDate: { type: Type.STRING, description: 'Filter start date (ISO YYYY-MM-DD).' },
      endDate: { type: Type.STRING, description: 'Filter end date (ISO YYYY-MM-DD).' },
      category: { type: Type.STRING, description: 'Filter by category.' },
      walletName: { type: Type.STRING, description: 'Filter by wallet name.' },
      limit: { type: Type.NUMBER, description: 'Max number of transactions to return.' }
    },
  }
};

const tools: Tool[] = [{
  functionDeclarations: [addTransactionTool, getWalletsTool, getTransactionsTool]
}];

// --- Services ---

export const generateFinancialInsight = async (
  transactions: Transaction[],
  wallets: Wallet[],
  language: string = 'en'
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "API Key Missing";

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare concise data for the prompt
    const recentTx = transactions.slice(0, 30).map(t => ({
      date: t.date.split('T')[0],
      desc: t.description,
      amt: t.amount,
      type: t.type,
      cat: t.category
    }));

    const walletSummary = wallets.map(w => `${w.name}: ${w.currency}${w.balance.toFixed(2)}`).join(', ');
    const targetLang = LANGUAGE_MAP[language] || 'English';

    const prompt = `
      Current Wallets: ${walletSummary}
      Recent Transactions: ${JSON.stringify(recentTx)}
      
      Analyze the financial health, identify trends, and give 1 specific optimization tip.
      Respond in ${targetLang}. Use Markdown.
    `;

    // Fix: Using `contents` directly instead of a nested object, and passing `systemInstruction` in `config`.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        temperature: 0.7
      }
    });

    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Service unavailable.";
  }
};

export const getChatModel = (lang: string = 'en') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key Missing");
  
  const ai = new GoogleGenAI({ apiKey });
  const targetLanguage = LANGUAGE_MAP[lang] || 'English';
  const now = new Date();

  const contextInstruction = `
    Context Data:
    - Today's Date: ${now.toLocaleDateString()}
    - Current ISO Time: ${now.toISOString()}
    - Language Requirement: You must communicate fluently and naturally in ${targetLanguage}.
    - Current User Role: Creator (all features unlocked).
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: BASE_SYSTEM_INSTRUCTION + "\n" + contextInstruction,
      tools: tools,
    }
  });
};