/**
 * BIKAN Mentor Revenue & SHU Dashboard
 * ─────────────────────────────────────
 * Panel bagi hasil untuk instruktur/mentor koperasi
 * Route: /mentor
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getMentorEarnings, getMemberShuHistory, MentorEarningSummary } from '@/app/actions/shu';
import { useAuth } from '@/src/features/auth/AuthContext';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<MentorEarningSummary | null>(null);
  const [shuHistory, setShuHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    getMentorEarnings(user.id).then(setEarnings);
    getMemberShuHistory(user.id).then(setShuHistory);
  }, [user]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const formatRp = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen bg-neutral-base p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black">Bagi Hasil & SHU</h1>
          <p className="text-sm text-muted-blue/50">Dashboard pendapatan mentor — {user.name}</p>
        </div>

        {/* Revenue Summary Cards */}
        {earnings && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Pendapatan" value={formatRp(earnings.totalGross)} color="text-muted-blue" />
            <StatCard label="Bersih (85%)" value={formatRp(earnings.totalNet)} color="text-muted-green" />
            <StatCard label="Platform Fee (15%)" value={formatRp(earnings.totalPlatformFee)} color="text-tactical-orange" />
            <StatCard label="Pending Payout" value={formatRp(earnings.pendingPayout)} color="text-tactical-red" />
          </div>
        )}

        {/* Earnings by Type */}
        {earnings && earnings.earningsByType.length > 0 && (
          <div className="soft-ui-card p-6 space-y-4">
            <h2 className="font-bold text-sm">Pendapatan per Sumber</h2>
            <div className="space-y-3">
              {earnings.earningsByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 rounded-xl bg-muted-blue/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {item.type === 'course_sale' ? '📚' : item.type === 'live_class' ? '🎬' : '🤝'}
                    </span>
                    <span className="text-sm font-medium capitalize">{item.type.replace('_', ' ')}</span>
                  </div>
                  <span className="font-bold text-sm">{formatRp(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capital Conversion Info */}
        <div className="soft-ui-card p-6 space-y-4 border-l-4 border-tactical-orange">
          <h2 className="font-bold text-sm">Konversi ke Modal Penyertaan</h2>
          <p className="text-xs text-muted-blue/50 leading-relaxed">
            Sesuai Permenkop No. 8/2021, Anda dapat mengonversi sebagian honorarium menjadi modal penyertaan koperasi. 
            Ini menjamin kepemilikan ekosistem (ecosystem ownership) dan meningkatkan porsi SHU Jasa Modal Anda.
          </p>
          {earnings && (
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-tactical-orange/5">
                <p className="text-[9px] uppercase text-muted-blue/40">Sudah Dikonversi</p>
                <p className="font-bold text-tactical-orange">{formatRp(earnings.totalConverted)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted-green/5">
                <p className="text-[9px] uppercase text-muted-blue/40">Tersedia untuk Konversi</p>
                <p className="font-bold text-muted-green">{formatRp(earnings.pendingPayout)}</p>
              </div>
            </div>
          )}
        </div>

        {/* SHU History */}
        <div className="soft-ui-card p-6 space-y-4">
          <h2 className="font-bold text-sm">Riwayat Pembagian SHU</h2>
          {shuHistory.length > 0 ? (
            <div className="space-y-2">
              {shuHistory.map((shu: any) => (
                <div key={shu.id} className="flex items-center justify-between p-3 rounded-xl bg-muted-blue/5">
                  <div>
                    <p className="text-sm font-bold">Tahun {shu.periodYear}</p>
                    <p className="text-[10px] text-muted-blue/40">
                      Jasa Usaha: {formatRp(shu.shuJasaUsaha)} | Jasa Modal: {formatRp(shu.shuJasaModal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-muted-green">{formatRp(shu.totalShu)}</p>
                    <p className="text-[9px] text-muted-blue/30">{shu.paidAt ? 'Dibayar' : 'Pending'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-blue/40 text-center py-4">
              Belum ada pembagian SHU. SHU dihitung dan dibagikan setiap akhir tahun buku.
            </p>
          )}
        </div>

        {/* SHU Formula Explanation */}
        <div className="soft-ui-card p-6 space-y-3 bg-muted-blue/5">
          <h2 className="font-bold text-sm">Formula Pembagian SHU</h2>
          <div className="text-xs text-muted-blue/60 space-y-2 font-mono">
            <p>SHU_member = SHU_jasa_usaha + SHU_jasa_modal</p>
            <p>SHU_jasa_usaha = (transaksi_anda / total_transaksi) × 45% laba bersih</p>
            <p>SHU_jasa_modal = (modal_anda / total_modal) × 25% laba bersih</p>
            <p className="text-muted-blue/30">Sisa: Cadangan koperasi (20%) + Dana pendidikan (10%)</p>
          </div>
          <p className="text-[10px] text-muted-blue/30 italic">
            Ref: Permenkop No. 8 Tahun 2021, Pasal 14 — Platform fee maksimal 15%
          </p>
        </div>

        <a href="/" className="block text-center text-xs font-bold text-tactical-orange hover:underline">
          ← Kembali ke App
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="soft-ui-card p-4 space-y-1">
      <p className="text-[9px] font-bold uppercase text-muted-blue/40">{label}</p>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}
