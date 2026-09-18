import { pool } from '../src/db/index.ts';

async function seedInfrastructure() {
  console.log('Seeding academic infrastructure...');

  // 1. Ensure demo users
  await pool.query(`
    UPDATE users SET email = 'admin@faculty360.demo' WHERE id = 'usr-admin';
    UPDATE users SET email = 'hod@faculty360.demo' WHERE id = 'usr-rajesh';
    UPDATE users SET email = 'faculty@faculty360.demo' WHERE id = 'usr-arun';
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
