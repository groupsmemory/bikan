-- BIKAN Item Bank Seed Data
-- Modul 1: Aljabar & Fungsi Kuadrat
-- 10 items dengan parameter IRT 3PLM (discrimination, difficulty, guessing)

INSERT INTO ims_core.item_bank (module_id, question, option_a, option_b, option_c, option_d, correct_option, discrimination, difficulty, guessing, bloom_level) VALUES

('mod-aljabar-kuadrat', 
 'Jika f(x) = x² + 2x + 1, berapakah nilai x saat f(x) = 0?',
 'x = 1', 'x = -1', 'x = 0', 'x = 2',
 'b', 1.00, -1.50, 0.25, 'C3'),

('mod-aljabar-kuadrat',
 'Tentukan diskriminan dari persamaan 2x² - 4x + 2 = 0.',
 'D = 0', 'D = 8', 'D = -8', 'D = 4',
 'a', 1.20, -0.50, 0.25, 'C3'),

('mod-aljabar-kuadrat',
 'Fungsi f(x) = -x² + 4x - 3 memiliki titik puncak di...',
 '(2, 1)', '(4, -3)', '(-2, 1)', '(2, -1)',
 'a', 1.40, 0.50, 0.20, 'C3'),

('mod-aljabar-kuadrat',
 'Persamaan kuadrat x² - 5x + 6 = 0 memiliki akar-akar...',
 'x = 2 dan x = 3', 'x = -2 dan x = -3', 'x = 1 dan x = 6', 'x = -1 dan x = -6',
 'a', 1.10, 0.00, 0.25, 'C3'),

('mod-aljabar-kuadrat',
 'Jika grafik y = ax² + bx + c melalui titik (0, 5), maka nilai c adalah...',
 'c = 5', 'c = 0', 'c = -5', 'Tidak dapat ditentukan',
 'a', 0.90, -1.00, 0.25, 'C2'),

('mod-aljabar-kuadrat',
 'Sumbu simetri dari f(x) = 3x² - 12x + 7 adalah...',
 'x = 2', 'x = 4', 'x = -2', 'x = 6',
 'a', 1.30, 1.00, 0.20, 'C3'),

('mod-aljabar-kuadrat',
 'Persamaan kuadrat yang akar-akarnya 3 dan -2 adalah...',
 'x² - x - 6 = 0', 'x² + x - 6 = 0', 'x² - x + 6 = 0', 'x² + x + 6 = 0',
 'a', 1.50, 1.50, 0.20, 'C4'),

('mod-aljabar-kuadrat',
 'Nilai minimum dari f(x) = 2x² - 8x + 10 adalah...',
 '2', '10', '-2', '0',
 'a', 1.60, 2.00, 0.20, 'C4'),

('mod-aljabar-kuadrat',
 'Agar persamaan x² + kx + 9 = 0 memiliki akar kembar, nilai k adalah...',
 'k = 6 atau k = -6', 'k = 3', 'k = 9', 'k = 0',
 'a', 1.80, 2.50, 0.15, 'C4'),

('mod-aljabar-kuadrat',
 'Jika x₁ dan x₂ adalah akar dari 2x² - 7x + 3 = 0, maka x₁² + x₂² = ...',
 '37/4', '49/4', '7/2', '3/2',
 'a', 2.00, 3.00, 0.15, 'C5');
