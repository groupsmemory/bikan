-- BIKAN Curriculum Modules Seed Data
-- Jalankan di Neon SQL Editor setelah CREATE TABLE

CREATE TABLE IF NOT EXISTS ims_core.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    mastery_threshold INT NOT NULL DEFAULT 90,
    prerequisite_module_id UUID,
    icon_emoji VARCHAR(10),
    active INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert 5 modules (progressive curriculum)
INSERT INTO ims_core.modules (slug, title, description, order_index, mastery_threshold, prerequisite_module_id, icon_emoji) VALUES
('mod-aljabar-kuadrat', 
 'Aljabar & Fungsi Kuadrat', 
 'Bentuk umum, diskriminan, titik puncak, pemfaktoran, dan grafik parabola',
 1, 90, NULL, '📐'),

('mod-linear-sistem',
 'Persamaan Linear & Sistem',
 'Sistem persamaan linear dua variabel, metode eliminasi dan substitusi',
 2, 90, 
 (SELECT id FROM ims_core.modules WHERE slug = 'mod-aljabar-kuadrat'),
 '📊'),

('mod-geometri-analitik',
 'Geometri Analitik',
 'Jarak, gradien, persamaan garis, lingkaran, dan transformasi koordinat',
 3, 90,
 (SELECT id FROM ims_core.modules WHERE slug = 'mod-linear-sistem'),
 '📏'),

('mod-trigonometri',
 'Trigonometri Dasar',
 'Fungsi trigonometri, identitas, persamaan trigonometri, dan aplikasi',
 4, 90,
 (SELECT id FROM ims_core.modules WHERE slug = 'mod-geometri-analitik'),
 '📐'),

('mod-kalkulus-intro',
 'Pengantar Kalkulus',
 'Limit, turunan, dan integral dasar untuk fungsi polinomial',
 5, 90,
 (SELECT id FROM ims_core.modules WHERE slug = 'mod-trigonometri'),
 '∫');
