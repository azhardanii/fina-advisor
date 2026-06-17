import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, Send, Activity, XCircle, Mic, CheckCircle2, Trash2, X, Camera, Plus, RefreshCcw } from 'lucide-react';
import { Wallet, Transaction, AllocationProposal, Category } from '@/types';
import { UserProfile } from '@/components/ProfileTab';
import ActionConfirmationModal from './ActionConfirmationModal';
import ClarificationModal, { ClarificationItem } from './ClarificationModal';
import CameraCapture from './CameraCapture';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  imagePreview?: string;
  actions?: any[];
  isError?: boolean;
};

interface AiInputTabProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  userProfile: UserProfile | null;
  onExecuteTransactions: (txs: Omit<Transaction, 'id'>[]) => Promise<boolean>;
  onShowAllocationProposal: (proposal: AllocationProposal) => void;
  onShowReceipt: (txs: Omit<Transaction, 'id'>[]) => void;
  onSaveCategory?: (cat: any) => void;
  onDataMutated?: () => void;
  onClose?: () => void;
  isDrawer?: boolean;
  onOpenAdvisor?: () => void;
}

export default function AiInputTab({ wallets, categories, transactions, userProfile, onExecuteTransactions, onShowAllocationProposal, onShowReceipt, onSaveCategory, onDataMutated, onClose, isDrawer, onOpenAdvisor }: AiInputTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: 'Halo! Aku FINA, asisten keuangan pribadimu. Ada yang bisa dibantu hari ini?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [pendingDynamicAction, setPendingDynamicAction] = useState<any | null>(null);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationItems, setClarificationItems] = useState<ClarificationItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'id-ID';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInputText(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('fina_chat_history');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
          setTimeout(scrollToBottom, 50);
          return;
        }
      } catch (e) { }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    // Hindari menimpa cache dengan pesan default saat pertama kali mount
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== '1')) {
      const cacheLimit = messages.slice(-50);
      localStorage.setItem('fina_chat_history', JSON.stringify(cacheLimit));
    }
  }, [messages]);

  const fetchHistory = async (cursor?: string) => {
    if (isLoadingHistory || !hasMoreHistory) return;
    setIsLoadingHistory(true);

    try {
      const url = cursor ? `/api/chat/history?cursor=${cursor}` : '/api/chat/history';
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) {
        if (data.length < 10) setHasMoreHistory(false);

        const mappedHistory: Message[] = data.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'model',
          content: m.content,
          actions: []
        }));

        mappedHistory.forEach(m => {
          if (m.role === 'model') {
            try {
              const parsed = JSON.parse(m.content);
              m.content = parsed.replyMessage || m.content;
              m.actions = parsed.actions || [];
            } catch (e) { }
          }
        });

        if (cursor) {
          const scrollHeightBefore = chatContainerRef.current?.scrollHeight || 0;
          setMessages(prev => [...mappedHistory, ...prev]);

          setTimeout(() => {
            if (chatContainerRef.current) {
              const scrollHeightAfter = chatContainerRef.current.scrollHeight;
              chatContainerRef.current.scrollTop = scrollHeightAfter - scrollHeightBefore;
            }
          }, 0);
        } else {
          setMessages(mappedHistory);
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      if (chatContainerRef.current.scrollTop === 0) {
        if (messages.length > 0 && hasMoreHistory) {
          fetchHistory(messages[0].id);
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 && !isLoadingHistory) {
      const el = chatContainerRef.current;
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
        scrollToBottom();
      }
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendSilentContextToAI = async (contextMessage: string) => {
    setIsLoading(true);
    try {
      const recentMessagesForApi = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      recentMessagesForApi.push({ role: 'user', content: contextMessage });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessagesForApi,
          wallets,
          categories,
          userProfile,
          recentTransactions: transactions.slice(0, 50)
        })
      });
      const data = await response.json();
      if (response.ok) {
        const reply: Message = {
          id: Date.now().toString(),
          role: 'model',
          content: data.replyMessage,
          actions: data.actions || []
        };
        setMessages(prev => [...prev, reply]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      console.error("Silent AI update failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const autoProcessActions = async (actions: any[]) => {
    if (!actions || actions.length === 0) return;

    // Group all record transactions
    const txsToRecord = actions
      .filter(a => a.type === 'RECORD_TRANSACTION')
      .map(a => {
        const w = wallets.find(w => w.name.toLowerCase() === (a.payload.walletName || '').toLowerCase()) || wallets[0];
        return {
          type: a.payload.type,
          amount: a.payload.amount,
          category: a.payload.category,
          note: a.payload.note,
          walletId: w?.id,
          date: a.payload.date || new Date().toISOString()
        };
      });

    if (txsToRecord.length > 0) {
      const success = await onExecuteTransactions(txsToRecord);
      if (success) {
        onShowReceipt(txsToRecord);
      }
    }

    // Auto-save categories if any
    const catProposals = actions.filter(a => a.type === 'PROPOSE_CATEGORY');
    for (const cat of catProposals) {
      if (onSaveCategory) {
        await onSaveCategory({
          id: Date.now().toString() + Math.random(),
          name: cat.payload.name,
          type: cat.payload.type,
          icon: 'tag',
          color: 'bg-teal-500'
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !imagePreview) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      imagePreview: imagePreview || undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 50);

    setInputText('');
    setInputImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsLoading(true);

    try {
      let base64Data = '';
      let mimeType = '';
      if (newMessage.imagePreview) {
        base64Data = newMessage.imagePreview.split(',')[1];
        mimeType = newMessage.imagePreview.substring(5, newMessage.imagePreview.indexOf(';'));
      }

      const recentMessagesForApi = messages.slice(-10).concat(newMessage);
      const apiMessages = recentMessagesForApi.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          wallets,
          categories,
          userProfile,
          recentTransactions: transactions.slice(0, 50),
          imageBase64: base64Data || undefined,
          imageMimeType: mimeType || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghubungi AI");

      const clarifyAction = data.actions?.find((a: any) => a.type === 'CLARIFY_TRANSACTIONS');
      const dynamicAction = data.actions?.find((a: any) => a.type === 'DYNAMIC_ACTION');

      if (clarifyAction) {
        setClarificationItems(clarifyAction.payload.items || []);
        setShowClarificationModal(true);
      } else if (dynamicAction) {
        setPendingDynamicAction(dynamicAction);
      } else {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.replyMessage || "Siap, aku sudah memprosesnya!",
          actions: data.actions || []
        };
        setMessages(prev => [...prev, reply]);
        setTimeout(scrollToBottom, 50);

        // Auto execute actions
        await autoProcessActions(reply.actions || []);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `Ups! Server AI sedang sibuk atau ada gangguan jaringan. Silakan coba kirim ulang ya.`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleRetryMessage = async (errorMsgId: string) => {
    const errorIndex = messages.findIndex(m => m.id === errorMsgId);
    if (errorIndex <= 0) return;

    const userMessage = messages[errorIndex - 1];
    if (userMessage.role !== 'user') return;

    setMessages(prev => prev.filter(m => m.id !== errorMsgId));
    setIsLoading(true);

    try {
      let base64Data = '';
      let mimeType = '';
      if (userMessage.imagePreview) {
        base64Data = userMessage.imagePreview.split(',')[1];
        mimeType = userMessage.imagePreview.substring(5, userMessage.imagePreview.indexOf(';'));
      }

      const recentMessagesForApi = messages.slice(Math.max(0, errorIndex - 10), errorIndex).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessagesForApi,
          wallets,
          categories,
          userProfile,
          recentTransactions: transactions.slice(0, 50),
          imageBase64: base64Data || undefined,
          imageMimeType: mimeType || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghubungi AI");

      const clarifyAction = data.actions?.find((a: any) => a.type === 'CLARIFY_TRANSACTIONS');
      const dynamicAction = data.actions?.find((a: any) => a.type === 'DYNAMIC_ACTION');

      if (clarifyAction) {
        setClarificationItems(clarifyAction.payload.items || []);
        setShowClarificationModal(true);
      } else if (dynamicAction) {
        setPendingDynamicAction(dynamicAction);
      } else {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.replyMessage || "Siap, aku sudah memprosesnya!",
          actions: data.actions || []
        };
        setMessages(prev => [...prev.filter(m => m.id !== errorMsgId), reply]);
        setTimeout(scrollToBottom, 50);
        await autoProcessActions(reply.actions || []);
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev.filter(m => m.id !== errorMsgId), {
        id: Date.now().toString(),
        role: 'model',
        content: `Ups! Server AI sedang sibuk atau ada gangguan jaringan. Silakan coba kirim ulang ya.`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleConfirmDynamicAction = async () => {
    if (!pendingDynamicAction) return;
    const action = pendingDynamicAction;
    try {
      const res = await fetch(action.payload.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: action.payload.actionType,
          data: action.payload.data
        })
      });
      const data = await res.json();
      setPendingDynamicAction(null);
      if (res.ok) {
        await sendSilentContextToAI(`Aksi berhasil dieksekusi: ${data.message}`);
        onDataMutated?.();
      } else {
        await sendSilentContextToAI(`Gagal mengeksekusi aksi: ${data.error}`);
      }
    } catch (error: any) {
      setPendingDynamicAction(null);
      await sendSilentContextToAI(`Gagal karena error jaringan: ${error.message}`);
    }
  };

  const handleCancelDynamicAction = async () => {
    setPendingDynamicAction(null);
    await sendSilentContextToAI("Aku (user) membatalkan aksi tersebut. Tidak usah dieksekusi.");
  };

  const handleClarificationSubmit = async (answers: string[]) => {
    setShowClarificationModal(false);

    let contextStr = "Berikut klarifikasi untuk transaksi sebelumnya:\n";
    clarificationItems.forEach((item, idx) => {
      contextStr += `${idx + 1}. ${item.description} -> Penjelasan: ${answers[idx]}\n`;
    });
    contextStr += "Sekarang tolong proses dan eksekusi semuanya secara bersamaan.";

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contextStr
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 50);

    setIsLoading(true);
    try {
      const recentMessagesForApi = messages.slice(-10).concat(newMessage);
      const apiMessages = recentMessagesForApi.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          wallets,
          categories,
          userProfile,
          recentTransactions: transactions.slice(0, 50)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.replyMessage || "Siap, sudah dicatat!",
        actions: data.actions || []
      };

      setMessages(prev => [...prev, reply]);
      setTimeout(scrollToBottom, 50);

      // Auto execute actions
      await autoProcessActions(reply.actions || []);

      const dynamicAction = reply.actions?.find(a => a.type === 'DYNAMIC_ACTION');
      if (dynamicAction) {
        setPendingDynamicAction(dynamicAction);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `Maaf gagal mengirim klarifikasi: ${e.message}`
      }]);
    } finally {
      setIsLoading(false);
      setClarificationItems([]);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Yakin ingin menghapus seluruh memori chat?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
      localStorage.removeItem('fina_chat_history');
      setMessages([{ id: '1', role: 'model', content: 'Halo! Aku FINA, asisten keuangan pribadimu. Memori baru saja dibersihkan. Ada yang bisa dibantu hari ini?' }]);
    } catch (e) {
      console.error("Failed to clear history", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: any, messageId: string) => {
    if (action.type === 'RECORD_TRANSACTION') {
      const w = wallets.find(w => w.name.toLowerCase() === (action.payload.walletName || '').toLowerCase()) || wallets[0];
      const tx = {
        type: action.payload.type,
        amount: action.payload.amount,
        category: action.payload.category,
        note: action.payload.note,
        walletId: w?.id,
        date: action.payload.date || new Date().toISOString()
      };
      const success = await onExecuteTransactions([tx]);
      if (success) {
        onShowReceipt([tx]);
      }
    } else if (action.type === 'PROPOSE_CATEGORY') {
      if (onSaveCategory) {
        await onSaveCategory({
          name: action.payload.name,
          type: action.payload.type || 'expense',
          color: action.payload.color || 'bg-blue-500'
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: m.actions?.filter(a => a !== action) } : m));
      }
    }
  };

  return (
    <div className={`bg-white ${isDrawer ? 'rounded-none md:rounded-l-3xl' : 'rounded-none md:rounded-3xl'} overflow-hidden shadow-2xl shadow-teal-900/5 border-0 md:border md:border-slate-100 flex flex-col ${isDrawer ? 'h-full' : 'h-full lg:h-[calc(100vh-120px)]'} relative`}>
      {pendingDynamicAction && (
        <ActionConfirmationModal
          description={pendingDynamicAction.payload.description}
          onConfirm={handleConfirmDynamicAction}
          onCancel={handleCancelDynamicAction}
        />
      )}
      {showClarificationModal && (
        <ClarificationModal
          items={clarificationItems}
          onClose={() => setShowClarificationModal(false)}
          onSubmit={handleClarificationSubmit}
        />
      )}
      {isCameraOpen && (
        <CameraCapture 
          onClose={() => setIsCameraOpen(false)} 
          onCapture={(base64) => {
            setImagePreview(base64);
            setIsCameraOpen(false);
          }} 
        />
      )}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 sm:p-5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">FINA</h2>
            <p className="text-teal-100 text-xs font-medium">Asisten Cerdas Pribadimu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              title="Tutup Chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 scroll-smooth flex flex-col">
        <div className="mt-auto flex flex-col space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                {msg.imagePreview && <img src={msg.imagePreview} alt="Upload" className="w-full max-w-sm rounded-lg mb-2 border border-black/10" />}
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                {msg.actions?.find((a: any) => a.type === 'RECOMMEND_ADVISOR') && onOpenAdvisor && (
                  <button 
                    onClick={onOpenAdvisor}
                    className="mt-3 w-full bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> Buka Evaluasi Mendalam
                  </button>
                )}
                {msg.isError && (
                  <button 
                    onClick={() => handleRetryMessage(msg.id)}
                    className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Coba Kirim Ulang
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="bg-white border-t border-slate-200 p-3 shrink-0 z-10">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-slate-200 object-cover shadow-sm" />
            <button onClick={() => { setInputImage(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"><XCircle className="w-4 h-4" /></button>
          </div>
        )}
        <div className="flex items-end space-x-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
          <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          
          <div className="relative shrink-0">
            <button 
              onClick={() => setIsAttachmentOpen(!isAttachmentOpen)} 
              className={`p-3 rounded-xl transition-all duration-200 ${isAttachmentOpen ? 'text-teal-600 bg-teal-50 shadow-sm' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`} 
              title="Lampiran"
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 ${isAttachmentOpen ? 'rotate-45' : ''}`} />
            </button>

            {isAttachmentOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAttachmentOpen(false)}></div>
                <div className="absolute bottom-full left-0 mb-3 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 w-40 z-50 animate-in zoom-in-95 origin-bottom-left">
                  <button 
                    onClick={() => { setIsCameraOpen(true); setIsAttachmentOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors text-left"
                  >
                    <Camera className="w-4 h-4 text-teal-600" /> Buka Kamera
                  </button>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsAttachmentOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors text-left"
                  >
                    <Upload className="w-4 h-4 text-teal-600" /> Galeri File
                  </button>
                </div>
              </>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isListening ? "Mendengarkan suara Anda..." : "Ketik transaksi atau tanya sesuatu..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 px-1 text-[15px] outline-none"
            rows={Math.min(4, inputText.split('\n').length)}
          />

          <button
            onClick={toggleListening}
            className={`p-3 shrink-0 rounded-xl transition-all ${isListening
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
              }`}
            title="Voice Input"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !imagePreview) || isLoading}
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
