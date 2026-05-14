/**
 * BIKAN Voice Input Hook (Web Speech API)
 * ────────────────────────────────────────
 * PRD US-ALG-004:
 * - Aktivasi asisten AI melalui input suara
 * - Transkripsi teks lokal dengan akurasi bahasa minimal 95%
 * - Timeout ketat 1.5 detik untuk respons
 *
 * Menggunakan SpeechRecognition API (native browser)
 * Supported: Chrome, Edge, Safari (partial)
 */

import { useState, useRef, useCallback } from 'react';

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceInput(lang: string = 'id-ID'): VoiceInputState {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check browser support
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Browser tidak mendukung input suara');
      return;
    }

    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;      // Stop after one sentence
    recognition.interimResults = true;   // Show partial results
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      switch (event.error) {
        case 'no-speech':
          setError('Tidak terdeteksi suara. Coba lagi.');
          break;
        case 'audio-capture':
          setError('Mikrofon tidak tersedia.');
          break;
        case 'not-allowed':
          setError('Izin mikrofon ditolak. Aktifkan di pengaturan browser.');
          break;
        default:
          setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognition, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
  };
}
