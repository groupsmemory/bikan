/**
 * BIKAN Pricing Panel
 * ───────────────────
 * Menampilkan paket langganan dan trigger pembayaran via Xendit
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { createInvoice, PLANS } from '@/app/actions/payment';

interface PricingPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  currentPlan: string;
}

export const PricingPanel: React.FC<PricingPanelProps> = ({ userId, userEmail, userName, currentPlan }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (planId: 'basic' | 'premium') => {
    setIsProcessing(planId);
    setError('');

    const result = await createInvoice(userId, userEmail, userName, planId);

    if (result.success && result.invoiceUrl) {
      // Redirect to Xendit payment page
      window.open(result.invoiceUrl, '_blank');
    } else {
      setError(result.error || 'Gagal memproses pembayaran');
    }

    setIsProcessing(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Pilih Paket Belajar</h2>
        <p className="text-sm text-muted-blue/50">Investasi terbaik untuk masa depan akademis Anda</p>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-tactical-red bg-tactical-red/5 px-3 py-2 rounded-lg text-center"
        >
          {error}
        </motion.p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Plan */}
        <div className={`soft-ui-card p-6 space-y-4 border-2 transition-colors ${
          currentPlan === 'basic' ? 'border-tactical-orange' : 'border-transparent'
        }`}>
          <div>
            <h3 className="font-bold text-lg">{PLANS.basic.name}</h3>
            <p className="text-[11px] text-muted-blue/50 mt-1">{PLANS.basic.description}</p>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-tactical-orange">{formatPrice(PLANS.basic.price)}</span>
            <span className="text-xs text-muted-blue/40 pb-1">/bulan</span>
          </div>
          <ul className="space-y-2">
            {PLANS.basic.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-green">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe('basic')}
            disabled={isProcessing !== null || currentPlan === 'basic'}
            className="w-full py-3 rounded-xl bg-tactical-orange text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50"
          >
            {isProcessing === 'basic' ? 'Memproses...' : currentPlan === 'basic' ? 'Paket Aktif' : 'Langganan Basic'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`soft-ui-card p-6 space-y-4 border-2 relative overflow-hidden transition-colors ${
          currentPlan === 'premium' ? 'border-muted-green' : 'border-transparent'
        }`}>
          {/* Popular badge */}
          <div className="absolute top-3 right-3 text-[8px] font-bold uppercase bg-muted-green text-white px-2 py-0.5 rounded-full">
            Populer
          </div>
          <div>
            <h3 className="font-bold text-lg">{PLANS.premium.name}</h3>
            <p className="text-[11px] text-muted-blue/50 mt-1">{PLANS.premium.description}</p>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-muted-green">{formatPrice(PLANS.premium.price)}</span>
            <span className="text-xs text-muted-blue/40 pb-1">/bulan</span>
          </div>
          <ul className="space-y-2">
            {PLANS.premium.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-green">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe('premium')}
            disabled={isProcessing !== null || currentPlan === 'premium'}
            className="w-full py-3 rounded-xl bg-muted-green text-white text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50"
          >
            {isProcessing === 'premium' ? 'Memproses...' : currentPlan === 'premium' ? 'Paket Aktif' : 'Langganan Premium'}
          </button>
        </div>
      </div>

      {/* Payment methods info */}
      <div className="text-center space-y-1">
        <p className="text-[9px] text-muted-blue/30 uppercase tracking-widest">Metode Pembayaran</p>
        <p className="text-[10px] text-muted-blue/40">
          Virtual Account (BCA, BNI, BRI, Mandiri) • E-Wallet (OVO, DANA, ShopeePay) • QRIS
        </p>
      </div>
    </div>
  );
};
