import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Building,
  CheckCircle2,
  CalendarDays,
  X,
  Plus,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { FacultyMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const FacultyDirectoryPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Admin Add Faculty state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    facultyId: '',
    designation: 'Assistant Professor',
    department: 'Computer Science',
    specialization: 'Artificial Intelligence, Algorithms',
  });

  useEffect(() => {
    loadFaculty();
  }, [selectedDept, selectedStatus, searchQuery]);

  const loadFaculty = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFaculty({
        department: selectedDept !== 'All' ? selectedDept : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        query: searchQuery || undefined
      });
      setFacultyList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProfile = async (id: string) => {
    try {
      const details = await api.getFacultyProfile(id);
      setSelectedFaculty(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email) {
      showToast('Name and email are required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.addFaculty({
        name: newFaculty.name,
        email: newFaculty.email,
        facultyId: newFaculty.facultyId || `FAC-${Date.now().toString().slice(-4)}`,
        designation: newFaculty.designation,
        department: newFaculty.department,
        specialization: newFaculty.specialization.split(',').map(s => s.trim()).filter(Boolean),
      });
      showToast(`Faculty member ${newFaculty.name} registered into database!`);
      setIsAddOpen(false);
      setNewFaculty({
        name: '',
        email: '',
        facultyId: '',
        designation: 'Assistant Professor',
        department: 'Computer Science',
        specialization: 'Artificial Intelligence, Algorithms',
      });
      loadFaculty();
    } catch (err: any) {
      showToast(err.message || 'Failed to add faculty member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Academic Community
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Faculty Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Roster of university teaching staff, research specializations, and daily teaching commitments
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by faculty name, ID, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-indigo-300"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Commerce">Commerce</option>
            <option value="Management">Management</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="In Lecture">In Lecture</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Grid of Faculty Cards */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading faculty directory from database...</span>
        </div>
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-100">
          No faculty members found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map((faculty) => {
            const isPresent = faculty.status === 'Present';
            const isInLecture = faculty.status === 'In Lecture';
            const isOnLeave = faculty.status === 'On Leave';

            return (
              <div
                key={faculty.id}
                onClick={() => handleOpenProfile(faculty.id)}
                className="p-5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={faculty.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={faculty.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#1a146b] transition-colors">
                          {faculty.name}
                        </h3>
                        <p className="text-xs text-slate-500">{faculty.designation}</p>
                        <span className="font-mono text-[10px] text-slate-400">{faculty.facultyId}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPresent && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-medium">
                          Present
                        </span>
                      )}
                      {isInLecture && (
                        <span className="px-2 py-0.5 rounded-full bg-[#e0e0ff] text-[#000668] font-mono text-[10px] font-medium">
                          In Lecture
                        </span>
                      )}
                      {isOnLeave && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[10px] font-medium">
                          On Leave
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specialization Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(faculty.specialization || []).map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Meta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>{faculty.classesToday ?? 0} classes today</span>
                  <span>{faculty.attendanceRate ?? 95}% Attendance</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add Faculty Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-serif font-semibold text-slate-900 text-base">
                  Register Faculty Member (Admin)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ananya Iyer"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya.iyer@takshashila.edu"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-2024-09"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specializations (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep Learning, Cloud Computing, Algorithms"
                  value={newFaculty.specialization}
                  onChange={(e) => setNewFaculty({ ...newFaculty, specialization: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Save Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Profile Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#3947dd] uppercase tracking-wider font-semibold">
                Faculty Profile Card
              </span>
              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <img
                  src={selectedFaculty.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedFaculty.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                />
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">
                    {selectedFaculty.name}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedFaculty.designation}</p>
                  <p className="font-mono text-[11px] text-indigo-700">{selectedFaculty.department}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f0f3ff] text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{selectedFaculty.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{selectedFaculty.phone || '+91 98450 12345'}</span>
                </div>
              </div>

              {/* Today's Schedule */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono mb-2">
                  Today's Teaching Schedule
                </h4>
                <div className="flex flex-col gap-2">
                  {(selectedFaculty.timetable || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No classes scheduled for today.</p>
                  ) : (
                    (selectedFaculty.timetable || []).map((slot: any) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{slot.courseName}</p>
                          <p className="text-[11px] text-slate-500">
                            {slot.courseCode} • Room {slot.room}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600">{slot.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Leave Record Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span>Available Leave Balance</span>
                <span className="font-mono font-semibold text-indigo-900">
                  {selectedFaculty.leaveBalance ?? 12} Days
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
