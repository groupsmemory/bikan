/**
 * BIKAN Digital Certificate Generator
 * ────────────────────────────────────
 * Generate sertifikat kompetensi saat mastery ≥ 90%
 * Render di browser → download sebagai PNG
 */

'use client';

import React, { useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface CertificateProps {
  studentName: string;
  moduleName: string;
  masteryScore: number;
  thetaScore: number;
  completedDate: string;
  certificateId: string;
}

export const CertificateGenerator: React.FC<CertificateProps> = ({
  studentName,
  moduleName,
  masteryScore,
  thetaScore,
  completedDate,
  certificateId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1200;
    const h = 850;
    canvas.width = w;
    canvas.height = h;

    // ─── Background ───
    // Gradient navy
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle border frame
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Inner border
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 45, w - 90, h - 90);

    // ─── Decorative corners ───
    const cornerSize = 40;
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(50, 50 + cornerSize); ctx.lineTo(50, 50); ctx.lineTo(50 + cornerSize, 50);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - 50 - cornerSize, 50); ctx.lineTo(w - 50, 50); ctx.lineTo(w - 50, 50 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(50, h - 50 - cornerSize); ctx.lineTo(50, h - 50); ctx.lineTo(50 + cornerSize, h - 50);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - 50 - cornerSize, h - 50); ctx.lineTo(w - 50, h - 50); ctx.lineTo(w - 50, h - 50 - cornerSize);
    ctx.stroke();

    // ─── Header ───
    ctx.fillStyle = '#F97316';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('KMP BIKAN 2026', w / 2, 100);

    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 42px system-ui';
    ctx.fillText('SERTIFIKAT KOMPETENSI', w / 2, 160);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px system-ui';
    ctx.fillText('CERTIFICATE OF COMPETENCY', w / 2, 190);

    // ─── Divider line ───
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 220); ctx.lineTo(w - 200, 220);
    ctx.stroke();

    // ─── Body ───
    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px system-ui';
    ctx.fillText('Diberikan kepada:', w / 2, 280);

    // Student name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px system-ui';
    ctx.fillText(studentName, w / 2, 340);

    // Underline name
    const nameWidth = ctx.measureText(studentName).width;
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((w - nameWidth) / 2 - 20, 355);
    ctx.lineTo((w + nameWidth) / 2 + 20, 355);
    ctx.stroke();

    // Description
    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px system-ui';
    ctx.fillText('Telah berhasil menyelesaikan modul:', w / 2, 410);

    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText(moduleName, w / 2, 455);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px system-ui';
    ctx.fillText('dengan pencapaian kompetensi berbasis Item Response Theory (IRT 3PLM)', w / 2, 500);

    // ─── Scores ───
    const scoreY = 570;
    // Mastery
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(w / 2 - 250, scoreY - 30, 200, 60);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${masteryScore.toFixed(1)}%`, w / 2 - 150, scoreY + 8);
    ctx.fillStyle = '#6EE7B7';
    ctx.font = '10px system-ui';
    ctx.fillText('MASTERY SCORE', w / 2 - 150, scoreY + 28);

    // Theta
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(w / 2 + 50, scoreY - 30, 200, 60);
    ctx.fillStyle = '#F97316';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`θ = ${thetaScore.toFixed(3)}`, w / 2 + 150, scoreY + 8);
    ctx.fillStyle = '#FDBA74';
    ctx.font = '10px system-ui';
    ctx.fillText('IRT ABILITY ESTIMATE', w / 2 + 150, scoreY + 28);

    // ─── Footer ───
    ctx.fillStyle = '#64748B';
    ctx.font = '14px system-ui';
    ctx.fillText(`Tanggal: ${completedDate}`, w / 2 - 200, h - 100);
    ctx.fillText(`ID: ${certificateId}`, w / 2 + 200, h - 100);

    // Platform signature
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 12px system-ui';
    ctx.fillText('Platform Pembelajaran Matematika Adaptif — Koperasi Multi-Pihak BIKAN', w / 2, h - 65);

    // Parabola decoration
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const normalX = (x - w / 2) / 300;
      const y = h - 40 - normalX * normalX * 15;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [studentName, moduleName, masteryScore, thetaScore, completedDate, certificateId]);

  const downloadCertificate = () => {
    generateCertificate();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `Sertifikat-BIKAN-${studentName.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Preview */}
      <div className="relative rounded-xl overflow-hidden border border-muted-blue/10 shadow-lg">
        <canvas
          ref={canvasRef}
          width={1200}
          height={850}
          className="w-full h-auto"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
        />
        {/* Auto-render on mount */}
        <div className="hidden" ref={() => setTimeout(generateCertificate, 100)} />
      </div>

      {/* Download Button */}
      <button
        onClick={downloadCertificate}
        className="w-full py-3 rounded-xl bg-muted-green text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
      >
        📥 Download Sertifikat (PNG)
      </button>

      {/* Certificate ID */}
      <p className="text-[9px] text-muted-blue/30 text-center font-mono">
        Certificate ID: {certificateId} • Verifiable at bikan.vercel.app/verify
      </p>
    </motion.div>
  );
};
