import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { COLORS } from '../../constants/colors';
import { CheckCircle2, XCircle, Clock, FileText, Calendar, ChevronDown } from 'lucide-react';

const Attendance = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    
    const [loading, setLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState(null);
    const [currentTerm, setCurrentTerm] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [week, setWeek] = useState(1);
    const [day, setDay] = useState('Monday');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatus, setAttendanceStatus] = useState({}); // { studentId: 'present' | 'absent' | 'late' | 'excused' }
    const [remarks, setRemarks] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState(null);
    const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
    const [fetchingRecords, setFetchingRecords] = useState(false);

    // Use refs to track current filter values to prevent race conditions
    const filterRef = useRef({
        classId: null,
        subjectId: null,
        week: null,
        day: null,
        date: null,
        sessionId: null,
        term: null
    });
    
    // Use ref to prevent concurrent fetches without causing dependency loops
    const fetchingRef = useRef(false);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Normalize date helper - memoized to prevent recreating
    const normalizeDate = useCallback((dateStr) => {
        if (!dateStr) return null;
        // If already in Y-m-d format, return as is
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // If it's a Date object or ISO string, extract Y-m-d
        if (dateStr instanceof Date) {
            return dateStr.toISOString().split('T')[0];
        }
        if (typeof dateStr === 'string') {
            return dateStr.split('T')[0];
        }
        return dateStr;
    }, []);

    // Initial load
    useEffect(() => {
        fetchCurrentSession();
        fetchClasses();
    }, []);

    // Update filter ref whenever filters change
    useEffect(() => {
        filterRef.current = {
            classId: selectedClass?.id || null,
            subjectId: selectedSubject?.id || null,
            week: week || null,
            day: day || null,
            date: normalizeDate(date),
            sessionId: currentSession?.id || null,
            term: currentTerm?.name || null
        };
    }, [selectedClass?.id, selectedSubject?.id, week, day, date, currentSession?.id, currentTerm?.name, normalizeDate]);

    // Fetch students when class/subject changes
    useEffect(() => {
        if (selectedClass?.id && selectedSubject?.id) {
            fetchStudents();
            // Reset states when class/subject changes
            setIsAttendanceMarked(false);
            setAttendanceRecords(null);
            setAttendanceStatus({});
            setRemarks({});
        } else {
            setStudents([]);
            setAttendanceStatus({});
            setRemarks({});
            setIsAttendanceMarked(false);
        }
    }, [selectedClass?.id, selectedSubject?.id]);

    // Reset attendance marked status when day/week/date changes
    useEffect(() => {
        if (selectedClass?.id && selectedSubject?.id && students.length > 0) {
            // Reset the marked status when filters change
            setIsAttendanceMarked(false);
            setAttendanceRecords(null);
            // Reset attendance status to default 'present' for all students
            const defaultStatus = {};
            students.forEach(student => {
                defaultStatus[student.id] = 'present';
            });
            setAttendanceStatus(defaultStatus);
            setRemarks({});
        }
    }, [week, day, date, selectedClass?.id, selectedSubject?.id]);

    // Check if we have all required data for fetching records
    const canFetchRecords = useMemo(() => {
        return !!(
            filterRef.current.classId &&
            filterRef.current.subjectId &&
            filterRef.current.week &&
            filterRef.current.day &&
            filterRef.current.date &&
            filterRef.current.sessionId &&
            filterRef.current.term &&
            students.length > 0
        );
    }, [students.length]);

    const fetchCurrentSession = async () => {
        try {
            const response = await API.getCurrentAcademicSession();
            console.log('📅 Current session response:', response);
            
            // Backend returns: { session, term, has_session, has_term }
            // Handle different response structures
            let session = null;
            let term = null;
            
            if (response?.data) {
                // If wrapped in data key
                session = response.data.session || response.data.academic_session;
                term = response.data.term;
            } else if (response?.session) {
                // Direct response structure
                session = response.session;
                term = response.term;
            } else if (response?.academic_session) {
                // Alternative structure
                session = response.academic_session;
                term = response.term;
            }
            
            if (session) {
                setCurrentSession(session);
                console.log('📅 Session set:', session);
            } else {
                console.warn('⚠️ No current session found in response');
            }
            
            if (term) {
                setCurrentTerm(term);
                console.log('📅 Term set:', term);
            } else {
                console.warn('⚠️ No current term found in response');
            }
            
            // If no session or term, still set loading to false so user can see the error
            if (!session || !term) {
                console.error('❌ Missing session or term:', { session: !!session, term: !!term });
            }
        } catch (error) {
            console.error('Error fetching current session:', error);
            showError('Failed to load current academic session. Please contact admin to set the current academic session.');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await API.getTeacherAttendanceClasses();
            // Handle different response structures
            let classesData = [];
            if (Array.isArray(response)) {
                classesData = response;
            } else if (response?.data) {
                if (Array.isArray(response.data)) {
                    classesData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    classesData = response.data.data;
                }
            }
            setClasses(classesData || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            showError('Error loading classes');
            setClasses([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await API.getClassStudentsForAttendance(selectedClass.id, selectedSubject.id);
            // Handle different response structures
            let studentsList = [];
            if (Array.isArray(response)) {
                studentsList = response;
            } else if (response?.data) {
                if (Array.isArray(response.data)) {
                    studentsList = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    studentsList = response.data.data;
                }
            }
            
            setStudents(studentsList);
            
            // Don't initialize status here - let fetchAttendanceRecords handle it
            // This prevents overwriting existing attendance when returning to the page
        } catch (error) {
            console.error('Error fetching students:', error);
            showError('Error loading students');
            setStudents([]);
        }
    };

    const fetchAttendanceRecords = useCallback(async () => {
        // Validate all required data is present using ref to prevent stale closures
        const currentFilter = filterRef.current;
        
        if (!currentFilter.classId || !currentFilter.subjectId || !currentFilter.week || 
            !currentFilter.day || !currentFilter.date || !currentFilter.sessionId || !currentFilter.term) {
            setIsAttendanceMarked(false);
            setAttendanceRecords(null);
            return;
        }

        // Prevent concurrent fetches using a ref to avoid dependency issues
        if (fetchingRef.current) {
            console.log('⏭️ Already fetching, skipping...');
            return;
        }
        
        fetchingRef.current = true;
        setFetchingRecords(true);
        
        try {
            const params = {
                class_id: currentFilter.classId,
                subject_id: currentFilter.subjectId,
                week: currentFilter.week,
                academic_session_id: currentFilter.sessionId,
                term: currentFilter.term,
            };
            
            const response = await API.getAttendanceRecords(params);
            
            // Handle different response structures
            let recordsData = [];
            if (Array.isArray(response)) {
                recordsData = response;
            } else if (response?.data) {
                if (Array.isArray(response.data)) {
                    recordsData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    recordsData = response.data.data;
                }
            }

            setAttendanceRecords(recordsData);
            
            // Normalize values for comparison
            const normalizedDate = normalizeDate(currentFilter.date);
            const normalizedWeek = Number(currentFilter.week);
            const normalizedDay = String(currentFilter.day).trim();
            
            console.log('🔍 Fetching attendance with params:', params);
            console.log('📅 Normalized search values:', {
                week: normalizedWeek,
                day: normalizedDay,
                date: normalizedDate,
                originalDate: currentFilter.date
            });
            
            // Build status and remarks maps from matching records
            const statusMap = {};
            const remarksMap = {};
            let markedForToday = false;

            // Simple, efficient matching logic
            if (recordsData.length > 0 && students.length > 0) {
                console.log('🔍 Checking attendance records:', {
                    recordsCount: recordsData.length,
                    studentsCount: students.length,
                    lookingFor: {
                        week: normalizedWeek,
                        day: normalizedDay,
                        date: normalizedDate
                    }
                });

                for (const record of recordsData) {
                    if (!record.records || !Array.isArray(record.records)) continue;
                    
                    const studentId = record.student_id;
                    
                    for (const r of record.records) {
                        // Normalize record values
                        const recordDate = normalizeDate(r.date);
                        const recordWeek = Number(r.week);
                        const recordDay = String(r.day).trim();
                        
                        console.log('📝 Checking record:', {
                            studentId,
                            recordWeek,
                            recordDay,
                            recordDate,
                            status: r.status,
                            matches: recordWeek === normalizedWeek && 
                                    recordDay === normalizedDay && 
                                    recordDate === normalizedDate
                        });
                        
                        // Check for exact match
                        if (recordWeek === normalizedWeek && 
                            recordDay === normalizedDay && 
                            recordDate === normalizedDate) {
                            markedForToday = true;
                            statusMap[studentId] = r.status || 'present';
                            if (r.remark) {
                                remarksMap[studentId] = r.remark;
                            }
                            console.log('✅ Match found for student:', studentId, 'status:', r.status);
                        }
                    }
                }
                
                console.log('📊 Final status map:', statusMap);
                console.log('📊 Marked for today:', markedForToday);
            }

            setIsAttendanceMarked(markedForToday);
            
            // Apply status and remarks to all students
            if (students.length > 0) {
                if (markedForToday && Object.keys(statusMap).length > 0) {
                    // Use saved status where available, default to 'present' for others
                    const finalStatusMap = {};
                    const finalRemarksMap = {};
                    
                    students.forEach(student => {
                        // Prioritize saved status from the map
                        finalStatusMap[student.id] = statusMap[student.id] || 'present';
                        if (remarksMap[student.id]) {
                            finalRemarksMap[student.id] = remarksMap[student.id];
                        }
                    });
                    
                    console.log('💾 Setting final status map:', finalStatusMap);
                    setAttendanceStatus(finalStatusMap);
                    setRemarks(finalRemarksMap);
                } else {
                    // No attendance found - set all to default 'present'
                    console.log('⚠️ No attendance found, setting defaults');
                    const defaultStatus = {};
                    students.forEach(student => {
                        defaultStatus[student.id] = 'present';
                    });
                    setAttendanceStatus(defaultStatus);
                    setRemarks({});
                }
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            setIsAttendanceMarked(false);
            setAttendanceRecords(null);
            showError('Failed to load attendance records');
        } finally {
            fetchingRef.current = false;
            setFetchingRecords(false);
        }
    }, [students, normalizeDate, showError]);

    // Fetch attendance records when all conditions are met
    useEffect(() => {
        // Check ref instead of state to avoid dependency loop
        if (canFetchRecords && !fetchingRef.current) {
            // Use a small delay to batch rapid changes
            const timer = setTimeout(() => {
                fetchAttendanceRecords();
            }, 150);
            return () => clearTimeout(timer);
        } else if (!canFetchRecords) {
            setIsAttendanceMarked(false);
            setAttendanceRecords(null);
        }
    }, [canFetchRecords, fetchAttendanceRecords]); // fetchAttendanceRecords is defined above

    const handleStatusChange = (studentId, status) => {
        setAttendanceStatus(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleRemarkChange = (studentId, remark) => {
        setRemarks(prev => ({
            ...prev,
            [studentId]: remark
        }));
    };

   const handleSubmit = useCallback(async () => {
    // Use filterRef as primary source, fallback to state
    const filterData = {
        classId: filterRef.current.classId || selectedClass?.id,
        subjectId: filterRef.current.subjectId || selectedSubject?.id,
        week: filterRef.current.week || week,
        day: filterRef.current.day || day,
        date: filterRef.current.date || date,
        sessionId: filterRef.current.sessionId || currentSession?.id,
        term: filterRef.current.term || currentTerm?.name
    };
    
    // Simple state-based validation
    if (!filterData.classId || !filterData.subjectId || !filterData.week || 
        !filterData.day || !filterData.date || !filterData.sessionId || !filterData.term) {
        console.error('Missing required fields:', {
            class: filterData.classId,
            subject: filterData.subjectId,
            week: filterData.week,
            day: filterData.day,
            date: filterData.date,
            session: filterData.sessionId,
            term: filterData.term,
            currentSessionState: currentSession,
            currentTermState: currentTerm
        });
        showError(`Please fill all required fields. Missing: ${Object.entries(filterData).filter(([k,v]) => !v).map(([k]) => k).join(', ')}`);
        return;
    }

    if (students.length === 0) {
        showError('No students to mark attendance for');
        return;
    }

    setSubmitting(true);
    try {
        const attendances = students.map(student => ({
            student_id: student.id,
            status: attendanceStatus[student.id] || 'present',
            remark: remarks[student.id] || null,
        }));

        const response = await API.markAttendance({
            class_id: filterData.classId,
            subject_id: filterData.subjectId,
            week: filterData.week,
            day: filterData.day,
            date: filterData.date,
            attendances: attendances,
        });

        const successMsg = response?.message || `Attendance marked successfully for ${filterData.day}, Week ${filterData.week}`;
        showSuccess(successMsg);
        
        // Update filterRef with latest values before refreshing
        filterRef.current = {
            classId: filterData.classId,
            subjectId: filterData.subjectId,
            week: filterData.week,
            day: filterData.day,
            date: filterData.date,
            sessionId: filterData.sessionId,
            term: filterData.term
        };
        
        await fetchAttendanceRecords();
        setIsAttendanceMarked(true);
    } catch (error) {
        console.error('Error marking attendance:', error);
        showError(error.message || 'Error marking attendance');
    } finally {
        setSubmitting(false);
    }
}, [selectedClass, selectedSubject, week, day, date, currentSession, currentTerm, students, attendanceStatus, remarks, showSuccess, showError, fetchAttendanceRecords]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.primary.red }}></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show error if no session/term is set (after loading completes)
    if (!currentSession || !currentTerm) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="mb-4">
                        <Calendar className="h-16 w-16 mx-auto text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.primary.red }}>
                        Academic Session Not Set
                    </h2>
                    <p className="text-gray-600 mb-6">
                        No current academic session or term has been configured. Please contact your administrator to set up the current academic session and term before marking attendance.
                    </p>
                    <button
                        onClick={() => navigate('/admin/settings')}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        style={{ backgroundColor: COLORS.primary.red }}
                    >
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary.red }}>
                        Mark Attendance
                    </h1>
                    {currentSession && currentTerm && (
                        <p className="text-gray-600">
                            Current Session: <span className="font-semibold">{currentSession.name}</span> | 
                            Current Term: <span className="font-semibold">{currentTerm.name}</span>
                        </p>
                    )}
                </div>

                {/* Selection Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Select Class & Subject</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                            <select
                                value={selectedClass?.id || ''}
                                onChange={(e) => {
                                    const classObj = classes.find(c => c.id === parseInt(e.target.value));
                                    setSelectedClass(classObj);
                                    setSelectedSubject(null);
                                    setStudents([]);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                            <select
                                value={selectedSubject?.id || ''}
                                onChange={(e) => {
                                    const subjectObj = selectedClass?.subjects?.find(s => s.id === parseInt(e.target.value));
                                    setSelectedSubject(subjectObj);
                                    setStudents([]);
                                }}
                                disabled={!selectedClass}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                            >
                                <option value="">Select Subject</option>
                                {selectedClass?.subjects?.map(subj => (
                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedClass && selectedSubject && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Week (1-14)</label>
                                <select
                                    value={week}
                                    onChange={(e) => setWeek(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    {Array.from({ length: 14 }, (_, i) => i + 1).map(w => (
                                        <option key={w} value={w}>Week {w}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                                <select
                                    value={day}
                                    onChange={(e) => setDay(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    {daysOfWeek.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Attendance Status Indicator */}
                    {selectedClass && selectedSubject && isAttendanceMarked && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">
                                Attendance has been marked for {day}, Week {week} ({date})
                            </span>
                        </div>
                    )}
                </div>

                {/* Students Table */}
                {students.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Students Attendance</h2>
                            {isAttendanceMarked && (
                                <span className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Marked
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">S/N</th>
                                        <th className="text-left py-3 px-4 font-semibold">Admission No.</th>
                                        <th className="text-left py-3 px-4 font-semibold">Student Name</th>
                                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold">Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{index + 1}</td>
                                            <td className="py-3 px-4">{student.admission_number}</td>
                                            <td className="py-3 px-4">{student.first_name} {student.middle_name || ''} {student.last_name}</td>
                                            <td className="py-3 px-4">
                                                <select
                                                    value={attendanceStatus[student.id] || 'present'}
                                                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="late">Late</option>
                                                    <option value="excused">Excused</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    value={remarks[student.id] || ''}
                                                    onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                                    placeholder="Optional remark"
                                                    className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mark Attendance Button - Moved here after the table */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || students.length === 0 || isAttendanceMarked}
                                className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                                style={{ backgroundColor: COLORS.primary.red }}
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : isAttendanceMarked ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        Already Marked
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        Mark Attendance
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Attendance Summary */}
                {attendanceRecords && attendanceRecords.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Attendance Summary</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">Student</th>
                                        <th className="text-center py-3 px-4 font-semibold">Total</th>
                                        <th className="text-center py-3 px-4 font-semibold">Present</th>
                                        <th className="text-center py-3 px-4 font-semibold">Absent</th>
                                        <th className="text-center py-3 px-4 font-semibold">Late</th>
                                        <th className="text-center py-3 px-4 font-semibold">Excused</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceRecords.map((record) => (
                                        <tr key={record.student_id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium">{record.student.name}</div>
                                                    <div className="text-sm text-gray-500">{record.student.admission_number}</div>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-4">{record.statistics.total}</td>
                                            <td className="text-center py-3 px-4 text-green-600 font-semibold">{record.statistics.present}</td>
                                            <td className="text-center py-3 px-4 text-red-600 font-semibold">{record.statistics.absent}</td>
                                            <td className="text-center py-3 px-4 text-yellow-600 font-semibold">{record.statistics.late}</td>
                                            <td className="text-center py-3 px-4 text-blue-600 font-semibold">{record.statistics.excused}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;

