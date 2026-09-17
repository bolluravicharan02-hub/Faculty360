import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core';

// 1. Departments Table
export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  hodName: text('hod_name').notNull(),
  facultyCount: integer('faculty_count').notNull().default(0),
  attendanceRate: integer('attendance_rate').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_departments_code').on(table.code),
]);

// 2. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('FACULTY'),
  facultyId: text('faculty_id').unique(),
  departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
  departmentName: text('department_name'),
  designation: text('designation'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  leaveCasual: integer('leave_casual').notNull().default(6),
  leaveMedical: integer('leave_medical').notNull().default(4),
  leaveEarned: integer('leave_earned').notNull().default(2),
  leaveTotal: integer('leave_total').notNull().default(12),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
  index('idx_users_faculty_id').on(table.facultyId),
]);

// 3. Faculty Directory Table
export const faculty = pgTable('faculty', {
  id: text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  facultyId: text('faculty_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  status: text('status').notNull().default('Present'),
  avatarUrl: text('avatar_url'),
  specialization: jsonb('specialization').notNull().$type<string[]>(),
  classesToday: integer('classes_today').notNull().default(0),
  attendanceRate: integer('attendance_rate').notNull().default(95),
  leaveBalance: integer('leave_balance').notNull().default(12),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_faculty_dept').on(table.department),
  index('idx_faculty_status').on(table.status),
]);

// 4. Timetable Slots Table
export const timetableSlots = pgTable('timetable_slots', {
  id: text('id').primaryKey(),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  subjectCode: text('subject_code').notNull(),
  subjectName: text('subject_name').notNull(),
  department: text('department').notNull(),
  section: text('section').notNull(),
  semester: text('semester').notNull(),
  classroom: text('classroom').notNull(),
  facultyId: text('faculty_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  facultyName: text('faculty_name').notNull(),
  status: text('status').notNull().default('SCHEDULED'),
  substitutedBy: text('substituted_by').references(() => users.id, { onDelete: 'set null' }),
  substitutedByName: text('substituted_by_name'),
  enrolledStudents: integer('enrolled_students').default(60),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_timetable_faculty').on(table.facultyId),
  index('idx_timetable_day').on(table.dayOfWeek),
  index('idx_timetable_status').on(table.status),
]);

// 5. Leave Requests Table
export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  facultyId: text('faculty_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  facultyName: text('faculty_name').notNull(),
  facultyEmail: text('faculty_email').notNull(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  leaveType: text('leave_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  daysCount: integer('days_count').notNull().default(1),
  reason: text('reason').notNull(),
  attachmentName: text('attachment_name'),
  status: text('status').notNull().default('PENDING'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewRemarks: text('review_remarks'),
}, (table) => [
  index('idx_leave_faculty').on(table.facultyId),
  index('idx_leave_status').on(table.status),
]);

// 6. Alternative Classes (Substitutions) Table
export const alternativeClasses = pgTable('alternative_classes', {
  id: text('id').primaryKey(),
  leaveRequestId: text('leave_request_id').references(() => leaveRequests.id, { onDelete: 'cascade' }),
  originalFacultyId: text('original_faculty_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalFacultyName: text('original_faculty_name').notNull(),
  subjectCode: text('subject_code').notNull(),
  subjectName: text('subject_name').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  classroom: text('classroom').notNull(),
  section: text('section').notNull(),
  reason: text('reason').notNull(),
  assignedFacultyId: text('assigned_faculty_id').references(() => users.id, { onDelete: 'set null' }),
  assignedFacultyName: text('assigned_faculty_name'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  status: text('status').notNull().default('PENDING_FACULTY_ASSIGNMENT'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_alt_orig_faculty').on(table.originalFacultyId),
  index('idx_alt_assigned_faculty').on(table.assignedFacultyId),
  index('idx_alt_status').on(table.status),
]);

// 7. Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  read: boolean('read').notNull().default(false),
  timestamp: text('timestamp').notNull(),
  actionUrl: text('action_url'),
  actionPayload: jsonb('action_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_read').on(table.read),
]);

// 8. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  module: text('module').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  details: text('details').notNull(),
  metadata: jsonb('metadata'),
}, (table) => [
  index('idx_audit_logs_timestamp').on(table.timestamp),
  index('idx_audit_logs_module').on(table.module),
]);

// 9. Subjects Table
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
  departmentName: text('department_name').notNull(),
  credits: integer('credits').notNull().default(4),
  semester: text('semester').notNull(),
  type: text('type').notNull().default('Core'),
  weeklyHours: integer('weekly_hours').notNull().default(4),
  syllabusSummary: text('syllabus_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_subjects_code').on(table.code),
  index('idx_subjects_dept').on(table.departmentId),
]);

// 10. Classrooms Table
export const classrooms = pgTable('classrooms', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  building: text('building').notNull(),
  floor: integer('floor').notNull().default(1),
  capacity: integer('capacity').notNull().default(60),
  type: text('type').notNull().default('Smart Lecture Hall'),
  facilities: jsonb('facilities'),
  status: text('status').notNull().default('Available'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_classrooms_room').on(table.roomNumber),
  index('idx_classrooms_building').on(table.building),
]);

// 11. Leave Types Table
export const leaveTypes = pgTable('leave_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  defaultQuota: integer('default_quota').notNull(),
  description: text('description'),
  requiresDocument: boolean('requires_document').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  timetableSlots: many(timetableSlots),
  leaveRequests: many(leaveRequests),
  assignedAlternativeClasses: many(alternativeClasses),
  notifications: many(notifications),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  faculty: one(users, {
    fields: [timetableSlots.facultyId],
    references: [users.id],
  }),
  substitute: one(users, {
    fields: [timetableSlots.substitutedBy],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one, many }) => ({
  faculty: one(users, {
    fields: [leaveRequests.facultyId],
    references: [users.id],
  }),
  alternativeClasses: many(alternativeClasses),
}));

export const alternativeClassesRelations = relations(alternativeClasses, ({ one }) => ({
  leaveRequest: one(leaveRequests, {
    fields: [alternativeClasses.leaveRequestId],
    references: [leaveRequests.id],
  }),
  originalFaculty: one(users, {
    fields: [alternativeClasses.originalFacultyId],
    references: [users.id],
  }),
  assignedFaculty: one(users, {
    fields: [alternativeClasses.assignedFacultyId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
