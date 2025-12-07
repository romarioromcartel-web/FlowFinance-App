

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, RefreshCw, AlertCircle, WifiOff, Loader } from 'lucide-react';
import { getChatModel } from '../services/geminiService';
import { ChatMessage, Transaction, Wallet, TransactionType } from '../types';
import { TRANSLATIONS, Language } from '../data/locales';
import ReactMarkdown from 'react-markdown';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  lang: Language;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  isOpen, onClose, wallets, transactions, onAddTransaction, lang
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLangRef = useRef<Language>(lang);

  const t = TRANSLATIONS[lang];

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatSession && isOnline) {
      try {
        const chat = getChatModel(lang); 
        setChatSession(chat);
        setSessionError(null);
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: t.chat_welcome,
          timestamp: new Date()
        }]);
      } catch (e: any) {
        console.error("Failed to init chat", e);
        const errorMsg = e.message?.includes('API Key') 
            ? "Error: API Key missing or invalid."
            : "Failed to initialize AI.";
        setSessionError(errorMsg);
        setMessages([{
          id: 'error',
          role: 'model',
          text: errorMsg,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, lang, isOnline, chatSession]);

  // Handle Language Change
  useEffect(() => {
    if (prevLangRef.current !== lang && isOnline) {
      setChatSession(null);
      setMessages([]);
      setSessionError(null);
      prevLangRef.current = lang;
    }
  }, [lang, isOnline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // --- Tool Implementations ---
  const handleGetWallets = () => {
    return {
      wallets: wallets.map(w => ({
        id: w.id,
        name: w.name,
        balance: w.balance,
        currency: w.currency,
        institution: w.institution || 'N/A'
      }))
    };
  };

  const handleGetTransactions = (args: any) => {
    let filtered = [...transactions];
    if (args?.startDate) {
      const start = new Date(args.startDate);
      if (!isNaN(start.getTime())) filtered = filtered.filter(t => new Date(t.date) >= start);
    }
    if (args?.endDate) {
      const end = new Date(args.endDate);
      if (!isNaN(end.getTime())) filtered = filtered.filter(t => new Date(t.date) <= end);
    }
    if (args?.category) {
      filtered = filtered.filter(t => t.category.toLowerCase().includes(String(args.category).toLowerCase()));
    }
    if (args?.walletName) {
      const wId = wallets.find(w => w.name.toLowerCase().includes(String(args.walletName).toLowerCase()))?.id;
      if (wId) filtered = filtered.filter(t => t.walletId === wId);
    }
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limit = args?.limit || 20;
    return {
      count: filtered.length,
      transactions: filtered.slice(0, limit).map(t => ({
        date: t.date.split('T')[0],
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        wallet: wallets.find(w => w.id === t.walletId)?.name
      }))
    };
  };

  const handleAddTransactionTool = (args: any) => {
    if (wallets.length === 0) return { error: "No wallets available. Ask user to create one." };
    
    let targetWallet = wallets[0];
    if (args?.walletName) {
      const found = wallets.find(w => 
        w.name.toLowerCase().includes(String(args.walletName).toLowerCase()) || 
        (w.institution && w.institution.toLowerCase().includes(String(args.walletName).toLowerCase()))
      );
      if (found) targetWallet = found;
    }
    
    let date = new Date();
    if (args?.date) {
      const parsedDate = new Date(args.date);
      if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
      }
    }
    const dateStr = date.toISOString();
    
    // Check duplicates
    const amountVal = Number(args.amount);
    const isDuplicate = transactions.some(t => {
      const tDate = new Date(t.date);
      const isSameDate = tDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
      return isSameDate && Math.abs(t.amount - amountVal) < 0.01 && t.type === args.type;
    });
    if (isDuplicate) return { result: "DUPLICATE_DETECTED", message: "Duplicate transaction found. Ask user if they want to proceed." };

    onAddTransaction({
      amount: amountVal,
      description: args.description ? String(args.description) : 'AI Transaction',
      category: args.category ? String(args.category) : 'General',
      type: args.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
      walletId: targetWallet.id,
      date: dateStr
    });
    return { result: "SUCCESS", message: `Successfully added ${args.amount} to ${targetWallet.name} for ${args.description}.` };
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSession || !isOnline || isProcessing || sessionError) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // 1. Send User Message
      let result = await chatSession.sendMessage({
          message: userMsg.text,
      });
      
      let turns = 0;
      
      // 2. Tool Loop
      while (result.functionCalls && result.functionCalls.length > 0 && turns < 5) {
        turns++;
        const functionResponses = [];
        
        for (const call of result.functionCalls) {
          let responseData;
          try {
            console.log(`Calling tool: ${call.name}`, call.args);
            if (call.name === 'getWallets') responseData = handleGetWallets();
            else if (call.name === 'getTransactions') responseData = handleGetTransactions(call.args);
            else if (call.name === 'addTransaction') responseData = handleAddTransactionTool(call.args);
            else responseData = { error: `Unknown tool: ${call.name}` };
          } catch (e: any) {
            console.error("Tool execution error", e);
            responseData = { error: e.message || "Tool execution failed" };
          }
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              id: call.id, 
              response: responseData
            }
          });
        }
        
        // CRITICAL FIX: Use 'sendMessage' for tool responses. 
        // Tool responses need to be encapsulated in a message object with `toolResponses`.
        result = await chatSession.sendMessage({
          message: {
            toolResponses: functionResponses.map(fr => fr.functionResponse)
          }
        });
      }
      
      const responseText = result.text;
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_response',
        role: 'model',
        text: responseText || "Action completed.",
        timestamp: new Date()
      }]);
    } catch (error: any) {
      console.error("Chat Error", error);
      const errorMsg = error.message?.includes('ContentUnion is required') 
          ? "Format Error: Content sent was invalid. Check the tool responses."
          : "Sorry, I encountered an error connecting to the AI service. Please try again.";
          
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_error',
        role: 'model',
        text: errorMsg,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible Backdrop for "Click Outside" to close */}
      <div 
        className="fixed inset-0 z-[90] bg-black/5" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="fixed bottom-20 right-4 md:right-6 w-80 md:w-96 max-w-[calc(100vw-32px)] h-[500px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col z-[100] animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-white">FlowAI</h3>
              <span className={`flex items-center text-[10px] font-medium ${isOnline ? (sessionError ? 'text-rose-500' : 'text-emerald-500') : 'text-rose-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline && !sessionError ? 'bg-emerald-500' : 'bg-rose-500'} ${isProcessing ? 'animate-ping' : ''}`}></span>
                {isOnline ? (isProcessing ? t.chat_thinking : (sessionError ? 'Error' : 'Online')) : 'Offline'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900 scroll-smooth">
          {!isOnline && (
             <div className="flex justify-center animate-fade-in">
                <div className="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg text-[10px] flex items-center space-x-1">
                   <WifiOff className="w-3 h-3" />
                   <span>Offline</span>
                </div>
             </div>
          )}
          {sessionError && (
            <div className="flex justify-center animate-fade-in">
               <div className="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg text-[10px] flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{sessionError}</span>
               </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`
                  max-w-[85%] rounded-2xl px-3 py-2 text-xs md:text-sm shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }
                `}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-xs dark:prose-invert max-w-none break-words">
                    <ReactMarkdown>{msg.text || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                )}
                <span className={`text-[9px] mt-1 block opacity-60 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start animate-fade-in">
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm flex items-center space-x-2">
                  <Loader className="w-3 h-3 text-indigo-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.chat_thinking}</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isOnline && !sessionError ? t.chat_placeholder : "Unavailable"}
              disabled={isProcessing || !isOnline || !!sessionError}
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || !isOnline || !!sessionError}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};