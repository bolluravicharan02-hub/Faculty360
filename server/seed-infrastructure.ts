import { pool } from '../src/db/index.ts';
import { supabaseServer, isSupabaseServerConfigured } from './supabase.ts';

async function seedInfrastructure() {
  console.log('Seeding academic infrastructure...');

  // 0. Ensure demo users exist in Supabase Auth
  if (isSupabaseServerConfigured) {
    try {
      const demoUsers = [
        { email: 'admin@faculty360.demo', id: 'usr-admin' },
        { email: 'hod@faculty360.demo', id: 'usr-rajesh' },
        { email: 'faculty@faculty360.demo', id: 'usr-arun' },
        { email: 'student@faculty360.demo', id: 'usr-student' },
      ];
      const testPassword = 'Faculty360@Admin2026!';

      const { data } = await supabaseServer.auth.admin.listUsers();
      const existingUsers = data?.users || [];

      for (const demo of demoUsers) {
        const found = existingUsers.find((u) => u.email?.toLowerCase() === demo.email.toLowerCase());
        if (!found) {
          console.log(`Creating Supabase Auth user: ${demo.email}`);
          const { data: created, error } = await supabaseServer.auth.admin.createUser({
            email: demo.email,
            password: testPassword,
            email_confirm: true,
          });
          if (error) {
            console.warn(`Could not create ${demo.email} in Supabase Auth:`, error.message);
          } else if (created?.user?.id) {
            await pool.query(`UPDATE users SET uid = $1 WHERE email = $2`, [created.user.id, demo.email]);
          }
        } else {
          console.log(`Updating Supabase Auth user password for: ${demo.email}`);
          await supabaseServer.auth.admin.updateUserById(found.id, { password: testPassword });
          await pool.query(`UPDATE users SET uid = $1 WHERE email = $2`, [found.id, demo.email]);
        }
      }
    } catch (authErr) {
      console.warn('Note: Could not sync with Supabase Auth admin API:', authErr);
    }
  }

  // 1. Ensure demo users in PostgreSQL database
  await pool.query(`
    UPDATE users SET email = 'admin@faculty360.demo' WHERE id = 'usr-admin';
    UPDATE users SET email = 'hod@faculty360.demo' WHERE id = 'usr-rajesh';
    UPDATE users SET email = 'faculty@faculty360.demo' WHERE id = 'usr-arun';

    INSERT INTO users (id, uid, email, name, role, department_id, department_name, student_id, program, semester, section, year_of_study, avatar_url, phone, leave_casual, leave_medical, leave_earned, leave_total)
    VALUES ('usr-student', '77a7055b-2143-4b90-b47c-de474eb762c4', 'student@faculty360.demo', 'Aarav Mehta', 'STUDENT', 'dept-cse', 'Department of Computer Science & Engineering', 'STU-2024-CSE-042', 'B.Tech Computer Science & Engineering', 'Semester 4', 'A', '2nd Year', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '+91 98111 22334', 0, 0, 0, 0)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = 'STUDENT',
      student_id = EXCLUDED.student_id,
      program = EXCLUDED.program,
      semester = EXCLUDED.semester,
      section = EXCLUDED.section,
      year_of_study = EXCLUDED.year_of_study;

    INSERT INTO students (id, student_id, user_id, name, email, department_id, department_name, program, semester, section, year_of_study, phone, avatar_url)
    VALUES ('stu-aarav', 'STU-2024-CSE-042', 'usr-student', 'Aarav Mehta', 'student@faculty360.demo', 'dept-cse', 'Department of Computer Science & Engineering', 'B.Tech Computer Science & Engineering', 'Semester 4', 'A', '2nd Year', '+91 98111 22334', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Seed Subjects
  await pool.query(`
    INSERT INTO subjects (id, code, name, department_id, department_name, credits, semester, type, weekly_hours, syllabus_summary)
    VALUES
      ('sub-cs201', 'CS-201', 'Data Structures & Algorithms', 'dept-cse', 'Department of Computer Science & Engineering', 4, 'Semester 3', 'Core', 4, 'Linear and non-linear data structures, asymptotic notation, sorting algorithms, graphs and trees.'),
      ('sub-cs202', 'CS-202', 'Database Management Systems', 'dept-cse', 'Department of Computer Science & Engineering', 4, 'Semester 4', 'Core', 4, 'Relational model, SQL, normalization, transaction processing, concurrency control, ACID properties.'),
      ('sub-cs301', 'CS-301', 'Operating Systems & Architecture', 'dept-cse', 'Department of Computer Science & Engineering', 4, 'Semester 5', 'Core', 4, 'Process synchronization, CPU scheduling, memory management, virtual memory, file system design.'),
      ('sub-cs302', 'CS-302', 'Artificial Intelligence & Machine Learning', 'dept-cse', 'Department of Computer Science & Engineering', 4, 'Semester 6', 'Core', 4, 'Heuristic search, supervised/unsupervised learning, neural networks, decision trees, reinforcement learning.'),
      ('sub-cs401', 'CS-401', 'Compiler Design & Formal Languages', 'dept-cse', 'Department of Computer Science & Engineering', 4, 'Semester 7', 'Core', 3, 'Lexical analysis, syntax analysis, context-free grammars, intermediate code generation, optimization.'),
      ('sub-cs402', 'CS-402', 'Cloud Computing & Distributed Systems', 'dept-cse', 'Department of Computer Science & Engineering', 3, 'Semester 7', 'Elective', 3, 'Virtualization, microservices, consensus protocols, distributed storage, container orchestration.'),
      ('sub-ec201', 'EC-201', 'Digital Signal Processing', 'dept-ece', 'Department of Electronics & Communication', 4, 'Semester 4', 'Core', 4, 'DFT, FFT, FIR and IIR filter design, multi-rate signal processing.'),
      ('sub-mg101', 'MG-101', 'Principles of Organizational Management', 'dept-mgmt', 'Department of Management Studies', 3, 'Semester 2', 'Core', 3, 'Organizational behavior, strategic planning, human resource management, leadership theories.'),
      ('sub-cm201', 'CM-201', 'Advanced Corporate Accounting', 'dept-comm', 'Department of Commerce & Accounting', 4, 'Semester 4', 'Core', 4, 'Valuation of goodwill and shares, liquidation accounts, holding company accounts.')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. Seed Classrooms
  await pool.query(`
    INSERT INTO classrooms (id, room_number, building, floor, capacity, type, facilities, status)
    VALUES
      ('cls-lh101', 'LH-101', 'Aryabhata Academic Block', 1, 90, 'Smart Lecture Hall', '["Dual 4K Projectors", "Lapel Audio System", "Central Air Conditioning", "Smart Board", "Lecture Capture Camera"]'::jsonb, 'Available'),
      ('cls-lh102', 'LH-102', 'Aryabhata Academic Block', 1, 90, 'Smart Lecture Hall', '["Dual 4K Projectors", "Lapel Audio System", "Central Air Conditioning", "Smart Board"]'::jsonb, 'Available'),
      ('cls-lh201', 'LH-201', 'Aryabhata Academic Block', 2, 75, 'Smart Lecture Hall', '["Ultra-HD Projector", "Wireless Audio System", "AC", "Interactive Display"]'::jsonb, 'Available'),
      ('cls-lh202', 'LH-202', 'Aryabhata Academic Block', 2, 75, 'Smart Lecture Hall', '["Ultra-HD Projector", "Audio System", "AC"]'::jsonb, 'Available'),
      ('cls-cs-lab1', 'CS-Lab 1', 'Turing Computing Complex', 1, 60, 'Computer Lab', '["60 High-Performance Workstations", "Gigabit Ethernet", "UPS Backup", "Overhead Projector", "AC"]'::jsonb, 'Available'),
      ('cls-cs-lab2', 'CS-Lab 2', 'Turing Computing Complex', 2, 60, 'Computer Lab', '["60 High-Performance Workstations", "GPU Compute Cluster Access", "AC", "Whiteboard"]'::jsonb, 'Available'),
      ('cls-sem-aud', 'Auditorium A', 'Chanakya Central Complex', 1, 250, 'Auditorium', '["Surround Audio", "Stage Lighting", "Multi-Camera Streaming", "Full AC", "Dual Presentation Screens"]'::jsonb, 'Available'),
      ('cls-sem-201', 'Seminar Hall 201', 'Chanakya Central Complex', 2, 80, 'Seminar Hall', '["Acoustic Paneling", "Wireless Mics", "Full HD Display", "Video Conferencing"]'::jsonb, 'Available')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 4. Seed Leave Types
  await pool.query(`
    INSERT INTO leave_types (id, name, code, default_quota, description, requires_document)
    VALUES
      ('lt-cl', 'Casual Leave', 'CL', 12, 'For personal urgent affairs, short family duties, or unforeseen exigencies.', false),
      ('lt-ml', 'Medical Leave', 'ML', 10, 'For certified illness or medical treatment, subject to medical certificate for >2 days.', true),
      ('lt-el', 'Earned Leave', 'EL', 15, 'Earned annual vacation leave credited based on completed active teaching tenure.', false),
      ('lt-dl', 'Duty Leave', 'DL', 15, 'For attending academic conferences, doctoral evaluations, syllabus revisions, or government commissions.', true)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('INFRASTRUCTURE SEEDED SUCCESSFULLY!');
  await pool.end();
}

seedInfrastructure().catch((err) => {
  console.error('SEEDING FAILED:', err);
  process.exit(1);
});
