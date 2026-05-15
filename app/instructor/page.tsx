/**
 * BIKAN Instructor Dashboard
 * ───────────────────────────
 * Panel khusus pengajar: analytics, manage soal, lihat siswa
 * Route: /instructor
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getInstructorStats, getRecentStudents, getAllItems, addItem, deleteItem } from '@/app/actions/instructor';
import { useAuth } from '@/src/features/auth/AuthContext';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'items' | 'students'>('overview');
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, totalItems: 0, activeLearnersWeek: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for adding items
  const [newItem, setNewItem] = useState({
    moduleId: 'mod-aljabar-kuadrat',
    question: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctOption: 'a', discrimination: '1.2', difficulty: '0.5', guessing: '0.25', bloomLevel: 'C3',
  });

  useEffect(() => {
    if (!user) return;
    getInstructorStats(user.id).then(setStats);
    getRecentStudents().then(setStudents);
    getAllItems().then(setItems);
  }, [user]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleAddItem = async () => {
    if (!newItem.question || !newItem.optionA) return;
    const result = await addItem(newItem);
    if (result.success) {
      setShowAddForm(false);
      setNewItem({ ...newItem, question: '', optionA: '', optionB: '', optionC: '', optionD: '' });
      getAllItems().then(setItems);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus soal ini?')) return;
    await deleteItem(id);
    getAllItems().then(setItems);
  };

  return (
    <div className="min-h-screen bg-neutral-base p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Dasbor Instruktur</h1>
            <p className="text-sm text-muted-blue/50">Selamat datang, {user.name}</p>
          </div>
          <a href="/" className="text-xs font-bold text-tactical-orange hover:underline">← Kembali ke App</a>
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {(['overview', 'items', 'students'] as const).map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeSection === section
                  ? 'bg-tactical-orange text-white shadow-lg'
                  : 'bg-white text-muted-blue/50 hover:bg-muted-blue/5'
              }`}
            >
              {section === 'overview' ? '📊 Overview' : section === 'items' ? '📝 Bank Soal' : '👥 Siswa'}
            </button>
          ))}
        </div>

        {/* ─── Overview Section ─── */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Siswa" value={stats.totalStudents} icon="👥" />
            <StatCard label="Kursus Aktif" value={stats.totalCourses} icon="📚" />
            <StatCard label="Bank Soal" value={stats.totalItems} icon="📝" />
            <StatCard label="Aktif (7 hari)" value={stats.activeLearnersWeek} icon="🔥" />
          </motion.div>
        )}

        {/* ─── Item Bank Section ─── */}
        {activeSection === 'items' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold">Bank Soal IRT ({items.length} items)</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-xl bg-tactical-orange text-white text-xs font-bold hover:scale-105 transition-transform"
              >
                {showAddForm ? '✕ Tutup' : '+ Tambah Soal'}
              </button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
              <div className="soft-ui-card p-6 space-y-3">
                <textarea
                  value={newItem.question}
                  onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                  placeholder="Pertanyaan..."
                  className="w-full p-3 rounded-lg border border-muted-blue/10 text-sm resize-none"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input value={newItem.optionA} onChange={e => setNewItem({ ...newItem, optionA: e.target.value })} placeholder="Opsi A" className="p-2 rounded-lg border border-muted-blue/10 text-sm" />
                  <input value={newItem.optionB} onChange={e => setNewItem({ ...newItem, optionB: e.target.value })} placeholder="Opsi B" className="p-2 rounded-lg border border-muted-blue/10 text-sm" />
                  <input value={newItem.optionC} onChange={e => setNewItem({ ...newItem, optionC: e.target.value })} placeholder="Opsi C" className="p-2 rounded-lg border border-muted-blue/10 text-sm" />
                  <input value={newItem.optionD} onChange={e => setNewItem({ ...newItem, optionD: e.target.value })} placeholder="Opsi D" className="p-2 rounded-lg border border-muted-blue/10 text-sm" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select value={newItem.correctOption} onChange={e => setNewItem({ ...newItem, correctOption: e.target.value })} className="p-2 rounded-lg border border-muted-blue/10 text-xs">
                    <option value="a">Jawaban: A</option>
                    <option value="b">Jawaban: B</option>
                    <option value="c">Jawaban: C</option>
                    <option value="d">Jawaban: D</option>
                  </select>
                  <input value={newItem.discrimination} onChange={e => setNewItem({ ...newItem, discrimination: e.target.value })} placeholder="a (disc)" className="p-2 rounded-lg border border-muted-blue/10 text-xs" />
                  <input value={newItem.difficulty} onChange={e => setNewItem({ ...newItem, difficulty: e.target.value })} placeholder="b (diff)" className="p-2 rounded-lg border border-muted-blue/10 text-xs" />
                  <input value={newItem.guessing} onChange={e => setNewItem({ ...newItem, guessing: e.target.value })} placeholder="c (guess)" className="p-2 rounded-lg border border-muted-blue/10 text-xs" />
                </div>
                <button onClick={handleAddItem} className="w-full py-2 rounded-lg bg-muted-green text-white text-xs font-bold">
                  Simpan Soal
                </button>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="soft-ui-card p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.question}</p>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-blue/40">
                      <span>a={item.discrimination}</span>
                      <span>b={item.difficulty}</span>
                      <span>c={item.guessing}</span>
                      <span className="text-tactical-orange">{item.bloomLevel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-xs text-tactical-red/50 hover:text-tactical-red"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Students Section ─── */}
        {activeSection === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-bold">Siswa Terdaftar ({students.length})</h2>
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="soft-ui-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{s.name}</p>
                    <p className="text-[10px] text-muted-blue/40">{s.email}</p>
                  </div>
                  <span className="text-[9px] text-muted-blue/30 font-mono">
                    {new Date(s.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-muted-blue/40 text-center py-8">Belum ada siswa terdaftar</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card Component ───
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="soft-ui-card p-5 text-center space-y-1">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-muted-blue/40 uppercase tracking-widest">{label}</p>
    </div>
  );
}
