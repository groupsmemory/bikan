/**
 * BIKAN Database Schema (Drizzle ORM)
 * ────────────────────────────────────
 * TypeScript representation of lib/db/schema.sql
 * Used by Drizzle for type-safe queries and migrations
 */

import {
  pgTable,
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  check,
  numeric,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Schemas ───
export const imsCore = pgSchema('ims_core');
export const imsAnalytics = pgSchema('ims_analytics');

// ─── Enums ───
export const userRoleEnum = imsCore.enum('user_role', ['admin', 'instructor', 'student']);
export const completionStatusEnum = imsCore.enum('completion_status', ['active', 'completed', 'dropped']);

// ─── 1. Users ───
export const users = imsCore.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  thetaScore: numeric('theta_score', { precision: 6, scale: 4 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 2. Courses ───
export const courses = imsCore.table('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  instructorId: uuid('instructor_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 3. Enrollments ───
export const enrollments = imsCore.table('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: completionStatusEnum('status').notNull().default('active'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 4. Resources ───
export const resources = imsCore.table('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 5. Assessments ───
export const assessments = imsCore.table('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  maxScore: integer('max_score').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 6. Grades ───
export const grades = imsCore.table('grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  feedback: text('feedback'),
  gradedAt: timestamp('graded_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 7. Learning Progress ───
export const learningProgress = imsCore.table('learning_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull(),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  lastAccessed: timestamp('last_accessed', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 8. AI Interaction Logs (Analytics) ───
export const aiInteractionLogs = imsAnalytics.table('ai_interaction_logs', {
  id: uuid('id').defaultRandom(),
  userId: uuid('user_id').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  latencyMs: integer('latency_ms').notNull(),
  workflowTag: varchar('workflow_tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 9. IRT Item Bank (Adaptive Assessment) ───
export const itemBank = imsCore.table('item_bank', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  question: text('question').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctOption: varchar('correct_option', { length: 1 }).notNull(), // 'a','b','c','d'
  // IRT 3PLM Parameters
  discrimination: numeric('discrimination', { precision: 4, scale: 2 }).notNull(), // a
  difficulty: numeric('difficulty', { precision: 4, scale: 2 }).notNull(),         // b
  guessing: numeric('guessing', { precision: 4, scale: 2 }).notNull(),             // c
  // Metadata
  bloomLevel: varchar('bloom_level', { length: 20 }),
  active: integer('active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 10. Learning Streaks (Keterikatan Belajar Harian) ───
// PRD Could Have: Pelacakan streak tanpa papan peringkat sosial
export const learningStreaks = imsCore.table('learning_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  streakDate: timestamp('streak_date', { withTimezone: true, mode: 'date' }).notNull(),
  minutesStudied: integer('minutes_studied').notNull().default(0),
  activitiesCompleted: integer('activities_completed').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 11. Subscriptions & Payments ───
export const subscriptionPlanEnum = imsCore.enum('subscription_plan', ['free', 'basic', 'premium']);
export const paymentStatusEnum = imsCore.enum('payment_status', ['pending', 'paid', 'expired', 'failed']);

export const subscriptions = imsCore.table('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum('plan').notNull().default('free'),
  xenditInvoiceId: varchar('xendit_invoice_id', { length: 255 }),
  xenditPaymentUrl: text('xendit_payment_url'),
  amount: integer('amount').notNull().default(0),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 12. Curriculum Modules ───
export const modules = imsCore.table('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  masteryThreshold: integer('mastery_threshold').notNull().default(90),
  prerequisiteModuleId: uuid('prerequisite_module_id'),
  iconEmoji: varchar('icon_emoji', { length: 10 }),
  active: integer('active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 13. SHU (Sisa Hasil Usaha) & Mentor Revenue ───
export const mentorEarnings = imsCore.table('mentor_earnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: uuid('mentor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'course_sale', 'live_class', 'referral_bonus'
  sourceId: varchar('source_id', { length: 255 }), // ID of course/session that generated revenue
  grossAmount: integer('gross_amount').notNull(), // Total revenue in IDR
  platformFee: integer('platform_fee').notNull(), // Platform cut (15% max per PRD)
  netAmount: integer('net_amount').notNull(), // Mentor's share
  convertedToCapital: integer('converted_to_capital').notNull().default(0), // Amount converted to koperasi equity
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'paid', 'converted'
  periodMonth: integer('period_month').notNull(), // 1-12
  periodYear: integer('period_year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const shuDistributions = imsCore.table('shu_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  memberType: varchar('member_type', { length: 30 }).notNull(), // 'producer', 'consumer', 'founder'
  periodYear: integer('period_year').notNull(),
  shuJasaUsaha: integer('shu_jasa_usaha').notNull().default(0), // From transaction volume
  shuJasaModal: integer('shu_jasa_modal').notNull().default(0), // From capital contribution
  totalShu: integer('total_shu').notNull().default(0),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
