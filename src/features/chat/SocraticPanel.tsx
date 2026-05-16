/**
 * BIKAN Socratic Assistant Panel
 * ───────────────────────────────
 * AI chat panel with voice input support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Mic, MicOff } from 'lucide-react';
import { askSocraticTutor } from '@/app/actions/ai-tutor';
import { useVoiceInput } from '@/src/hooks/use-voice-input';

interface SocraticPanelProps {
  userId: string;
  /** Active lesson ID — used to pull AIContext from Git-CMS */
  lessonId?: string;
}

export const SocraticPanel: React.FC<SocraticPanelProps> = ({ userId, lessonId = 'lesson-01-pengantar' }) => {
  const [chatInput, setChatInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ total: number; cached: number; latency: number } | null>(null);

  // Voice Input
  const { isListening, transcript, isSupported: voiceSupported, error: voiceError, startListening, stopListening } = useVoiceInput('id-ID');

  useEffect(() => {
    if (transcript) setChatInput(transcript);
  }, [transcript]);

  const handleAskAI = async () => {
    const message = chatInput.trim();
    if (!message || isAiLoading) return;

    setIsAiLoading(true);
    setChatInput('');

    try {
      const result = await askSocraticTutor(
        userId,
        message,
        lessonId
      );
      setAiResponse(result.text);
      setTokenInfo({ total: result.tokens, cached: result.cached, latency: result.latencyMs });
    } catch (error: any) {
      setAiResponse(error.message || 'Terjadi kesalahan. Coba lagi.');
      setTokenInfo(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="soft-ui-card bg-muted-blue p-6 text-white overflow-hidden relative min-h-[400px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-tactical-orange flex items-center justify-center">?</div>
        <h3 className="font-bold text-sm">Socratic Assistant</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none text-[13px] leading-relaxed border border-white/5">
          Selamat datang di sesi IRT Adaptif. Materi apa yang ingin Anda eksplorasi lebih dalam?
        </div>

        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-tactical-orange/20 p-4 rounded-2xl rounded-tr-none text-[13px] leading-relaxed border border-tactical-orange/30 italic self-end ml-4"
          >
            {aiResponse}
            {tokenInfo && (
              <div className="mt-2 text-[9px] font-mono text-white/30 not-italic">
                tokens: {tokenInfo.total} | cached: {tokenInfo.cached} | {tokenInfo.latency}ms
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-4 relative">
        <input
          disabled={isAiLoading}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={isListening ? '🎙️ Mendengarkan...' : 'Tanyakan sesuatu...'}
          className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-tactical-orange transition-all placeholder:text-white/20 ${
            isListening ? 'border-tactical-orange/50 ring-1 ring-tactical-orange/30' : 'border-white/10'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
        />
        <div className="absolute right-2 top-2 flex gap-1">
          {voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isAiLoading}
              className={`p-1.5 rounded-lg transition-all ${
                isListening ? 'bg-tactical-red animate-pulse shadow-lg' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isListening ? 'Stop' : 'Input suara'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white/60" />}
            </button>
          )}
          <button
            onClick={handleAskAI}
            disabled={isAiLoading || !chatInput.trim()}
            className="p-1.5 bg-tactical-orange rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
        {voiceError && (
          <p className="text-[9px] text-tactical-red/80 mt-1">{voiceError}</p>
        )}
      </div>
    </div>
  );
};
