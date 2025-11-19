import { useState, useEffect } from 'react';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { COLORS } from '../../constants/colors';
import { Download, Filter, TrendingUp, Users, Calendar, BookOpen } from 'lucide-react';
import debug from '../../utils/debug';

const AttendanceAnalysis = () => {
    const { showError } = useNotification();
    
    const [loading, setLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState(null);
    const [currentTerm, setCurrentTerm] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchCurrentSession();
        fetchSessions();
        fetchClasses();
    }, []);

    // Only auto-fetch on initial load when session/term are set
    // User must click "Apply Filters" button for class/week changes
    useEffect(() => {
        if (selectedSession && selectedTerm && !selectedClass && !selectedWeek) {
            fetchStatistics();
        }
    }, [selectedSession, selectedTerm]);

    const fetchCurrentSession = async () => {
        try {
            const response = await API.getCurrentAcademicSession();
            debug.component('AttendanceAnalysis', 'fetchCurrentSession - Response received');
            
            // Backend returns: { session, term, has_session, has_term }
            // Handle different response structures
            let session = null;
            let term = null;
            
            if (response?.data) {
                session = response.data.session || response.data.academic_session;
                term = response.data.term;
            } else if (response?.session) {
                session = response.session;
                term = response.term;
            } else if (response?.academic_session) {
                session = response.academic_session;
                term = response.term;
            }
            
            if (session) {
                setCurrentSession(session);
                // Set selected session/term to current if not already set
                setSelectedSession(session.id);
                debug.component('AttendanceAnalysis', 'Session set', { sessionId: session.id });
            }
            
            if (term) {
                setCurrentTerm(term);
                // Set selected term to current
                setSelectedTerm(term.name);
                debug.component('AttendanceAnalysis', 'Term set', { term: term.name });
            }
        } catch (error) {
            debug.error('Error fetching current session:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await API.getAcademicSessions();
            // Handle different response structures
            let sessionsData = [];
            if (Array.isArray(response)) {
                sessionsData = response;
            } else if (response?.data) {
                if (Array.isArray(response.data)) {
                    sessionsData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    sessionsData = response.data.data;
                }
            }
            setSessions(sessionsData || []);
        } catch (error) {
            debug.error('Error fetching sessions:', error);
            setSessions([]);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await API.getClasses();
            let classData = response?.data;
            if (Array.isArray(response)) {
                classData = response;
            } else if (response?.data?.data && Array.isArray(response.data.data)) {
                classData = response.data.data;
            }
            setClasses(classData || []);
        } catch (error) {
            debug.error('Error fetching classes:', error);
        }
    };

    const fetchStatistics = async () => {
        debug.component('AttendanceAnalysis', 'fetchStatistics called', {
            selectedSession,
            selectedTerm,
            selectedClass,
            selectedWeek
        });
        
        if (!selectedSession || !selectedTerm) {
            debug.warn('Missing required filters:', {
                hasSession: !!selectedSession,
                hasTerm: !!selectedTerm
            });
            setStatistics(null);
            showError('Please select an academic session and term');
            return;
        }
        
        setLoading(true);
        try {
            const params = {
                academic_session_id: selectedSession,
                term: selectedTerm,
            };

            if (selectedClass) {
                params.class_id = selectedClass;
            }

            if (selectedWeek) {
                params.week = selectedWeek;
            }

            debug.component('AttendanceAnalysis', 'Fetching statistics', { params });
            const response = await API.getAttendanceStatistics(params);
            
            // Handle different response structures
            // API.js returns: { data: {...}, status: 200 }
            // Backend returns: { data: { overall: {...}, by_student: [...], by_class: [...] } }
            // So final structure: response.data.data contains the actual statistics
            let statisticsData = null;
            
            if (response?.data?.data) {
                // Double nested: API.js wraps backend response
                statisticsData = response.data.data;
            } else if (response?.data && response.data.overall) {
                // Single nested: direct backend response
                statisticsData = response.data;
            } else if (response?.overall) {
                // Direct structure
                statisticsData = response;
            } else if (response?.data) {
                // Fallback to just data
                statisticsData = response.data;
            }
            
            debug.component('AttendanceAnalysis', 'Statistics processed');
            
            // Ensure we have proper structure even if empty
            if (!statisticsData || !statisticsData.overall) {
                statisticsData = {
                    overall: {
                        total_records: 0,
                        total_present: 0,
                        total_absent: 0,
                        unique_students: 0,
                        average_attendance_rate: 0
                    },
                    by_student: statisticsData?.by_student || [],
                    by_class: statisticsData?.by_class || []
                };
            }
            
            debug.component('AttendanceAnalysis', 'Statistics set');
            setStatistics(statisticsData);
        } catch (error) {
            debug.error('Error fetching statistics:', error);
            showError('Error loading attendance statistics');
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        // TODO: Implement export functionality
        showError('Export feature coming soon');
    };

    const weeks = Array.from({ length: 14 }, (_, i) => i + 1);

    if (loading && !statistics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary.red }}>
                            Attendance Analysis
                        </h1>
                        {currentSession && currentTerm && (
                            <p className="text-gray-600">
                                Current Session: <span className="font-semibold">{currentSession.name}</span> | 
                                Current Term: <span className="font-semibold">{currentTerm.name}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <Filter className="mr-2 h-5 w-5 text-gray-600" />
                        <h2 className="text-xl font-semibold">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Session</label>
                            <select
                                value={selectedSession || ''}
                                onChange={(e) => {
                                    if (e.target.value === '') {
                                        // Reset to current session
                                        setSelectedSession(currentSession?.id || null);
                                        setSelectedTerm(currentTerm?.name || null);
                                    } else {
                                        setSelectedSession(parseInt(e.target.value));
                                        // Keep term if it's valid for the new session, otherwise reset
                                        if (!selectedTerm) {
                                            setSelectedTerm(currentTerm?.name || null);
                                        }
                                    }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Current Session</option>
                                {sessions.map(session => (
                                    <option key={session.id} value={session.id}>{session.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                            <select
                                value={selectedTerm || ''}
                                onChange={(e) => {
                                    const termValue = e.target.value || null;
                                    setSelectedTerm(termValue);
                                    debug.component('AttendanceAnalysis', 'Term changed', { term: termValue });
                                }}
                                disabled={!selectedSession}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                            >
                                <option value="">Select Term</option>
                                <option value="first">First Term</option>
                                <option value="second">Second Term</option>
                                <option value="third">Third Term</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                            <select
                                value={selectedClass || ''}
                                onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
                            <select
                                value={selectedWeek || ''}
                                onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">All Weeks</option>
                                {weeks.map(w => (
                                    <option key={w} value={w}>Week {w}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                debug.component('AttendanceAnalysis', 'Apply Filters clicked', {
                                    selectedSession,
                                    selectedTerm,
                                    selectedClass,
                                    selectedWeek,
                                    loading,
                                    currentSession: currentSession?.id,
                                    currentTerm: currentTerm?.name
                                });
                                
                                // Validate required fields
                                if (!selectedSession) {
                                    showError('Please select an academic session');
                                    return;
                                }
                                
                                if (!selectedTerm || selectedTerm === '') {
                                    showError('Please select a term');
                                    return;
                                }
                                
                                fetchStatistics();
                            }}
                            disabled={loading}
                            className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                            style={{ backgroundColor: COLORS.primary.red }}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {loading ? 'Loading...' : 'Apply Filters'}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && !statistics && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
                    </div>
                )}

                {/* Overall Statistics */}
                {!loading && statistics && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Records</p>
                                        <p className="text-2xl font-bold" style={{ color: COLORS.primary.red }}>
                                            {statistics.overall?.total_records || 0}
                                        </p>
                                    </div>
                                    <Calendar className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Present</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {statistics.overall?.total_present || 0}
                                        </p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-400" />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Absent</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {statistics.overall?.total_absent || 0}
                                        </p>
                                    </div>
                                    <Users className="h-8 w-8 text-red-400" />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                                        <p className="text-2xl font-bold" style={{ color: COLORS.primary.red }}>
                                            {statistics.overall?.average_attendance_rate?.toFixed(1) || 0}%
                                        </p>
                                    </div>
                                    <TrendingUp className="h-8 w-8" style={{ color: COLORS.primary.red }} />
                                </div>
                            </div>
                        </div>

                        {/* Class-wise Statistics */}
                        {statistics.by_class && statistics.by_class.length > 0 && !selectedClass && (
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Class-wise Statistics
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-semibold">Class</th>
                                                <th className="text-center py-3 px-4 font-semibold">Total Records</th>
                                                <th className="text-center py-3 px-4 font-semibold">Present</th>
                                                <th className="text-center py-3 px-4 font-semibold">Students</th>
                                                <th className="text-center py-3 px-4 font-semibold">Attendance Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics.by_class.map((classStat, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium">{classStat.class_name}</td>
                                                    <td className="text-center py-3 px-4">{classStat.total_records}</td>
                                                    <td className="text-center py-3 px-4 text-green-600 font-semibold">{classStat.total_present}</td>
                                                    <td className="text-center py-3 px-4">{classStat.total_students}</td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className="font-semibold" style={{ color: COLORS.primary.red }}>
                                                            {classStat.average_attendance_rate.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Student-wise Statistics */}
                        {statistics.by_student && statistics.by_student.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <Users className="mr-2 h-5 w-5" />
                                    Student-wise Statistics
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-semibold">S/N</th>
                                                <th className="text-left py-3 px-4 font-semibold">Student Name</th>
                                                <th className="text-left py-3 px-4 font-semibold">Admission No.</th>
                                                <th className="text-center py-3 px-4 font-semibold">Total</th>
                                                <th className="text-center py-3 px-4 font-semibold">Present</th>
                                                <th className="text-center py-3 px-4 font-semibold">Absent</th>
                                                <th className="text-center py-3 px-4 font-semibold">Attendance Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics.by_student.map((student, index) => (
                                                <tr key={student.student_id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">{index + 1}</td>
                                                    <td className="py-3 px-4 font-medium">{student.student_name}</td>
                                                    <td className="py-3 px-4 text-gray-600">{student.admission_number}</td>
                                                    <td className="text-center py-3 px-4">{student.total}</td>
                                                    <td className="text-center py-3 px-4 text-green-600 font-semibold">{student.present}</td>
                                                    <td className="text-center py-3 px-4 text-red-600 font-semibold">{student.absent}</td>
                                                    <td className="text-center py-3 px-4">
                                                        <span 
                                                            className={`font-semibold ${
                                                                student.attendance_rate >= 80 ? 'text-green-600' : 
                                                                student.attendance_rate >= 60 ? 'text-yellow-600' : 
                                                                'text-red-600'
                                                            }`}
                                                        >
                                                            {student.attendance_rate.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">
                                        {selectedClass 
                                            ? `No student attendance data found for the selected class and week.`
                                            : `No student attendance data available.`}
                                    </p>
                                    {selectedClass && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Attendance may not have been marked for this class, subject, or week yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!loading && !statistics && selectedSession && selectedTerm && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="flex flex-col items-center">
                            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data Found</h3>
                            <p className="text-gray-600 mb-4">
                                {selectedClass 
                                    ? `No attendance records found for the selected filters.`
                                    : `No attendance records found for this session and term.`}
                            </p>
                            {selectedClass && (
                                <p className="text-sm text-gray-500">
                                    Try selecting a different class, week, or check if attendance has been marked for this period.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {!loading && !selectedSession && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="flex flex-col items-center">
                            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Filters</h3>
                            <p className="text-gray-600">
                                Please select an academic session and term to view attendance analysis.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceAnalysis;

