import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  Calculator,
  Save,
  X,
  Award,
  TrendingUp,
  FileText,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const ManageScores = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scores, setScores] = useState({
    first_ca: '',
    second_ca: '',
    exam_score: '',
    total_score: '',
    grade: '',
    remark: ''
  });
  const [term, setTerm] = useState('first');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingScore, setEditingScore] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, scoreId: null });
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentScores, setStudentScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importModal, setImportModal] = useState({ 
    isOpen: false, 
    importing: false, 
    selectedClassId: null, 
    selectedSubjectId: null 
  });
  const [importResults, setImportResults] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const { showError, showSuccess } = useNotification();
  const { user } = useAuth();

  // Get teacher's assigned classes and subjects
  useEffect(() => {
    console.log('ManageScores - User role:', user?.role);
    if (user?.role === 'teacher') {
      fetchTeacherAssignments();
    } else if (user?.role === 'admin') {
      fetchAdminData();
    }
    // Fetch current academic session and term
    fetchCurrentSessionAndTerm();
  }, [user]);

  // Fetch current academic session and term
  const fetchCurrentSessionAndTerm = async () => {
    try {
      const response = await API.getCurrentAcademicSession();
      const data = response.data || response;
      setCurrentSession(data.session);
      setCurrentTerm(data.term);
      
      // Set default term to current term when opening modal
      if (data.term && data.term.name) {
        setTerm(data.term.name);
      }
    } catch (error) {
      console.error('Error fetching current session/term:', error);
    }
  };

  // Refresh scores when class or subject changes
  useEffect(() => {
    // Clear scores immediately when subject changes to prevent showing old data
    if (selectedClass && selectedSubject && Array.isArray(students) && students.length > 0) {
      // Pass current class and subject explicitly to avoid closure issues
      loadStudentScores(students, selectedClass, selectedSubject);
    } else {
      // Clear scores if class/subject/students are not available
      setStudentScores({});
    }
  }, [selectedClass, selectedSubject, students]);

  const fetchTeacherAssignments = async () => {
    try {
      setLoading(true);
      const response = await API.getTeacherAssignmentsForScores();
      console.log('Teacher assignments response:', response);
      
      // Handle different response formats
      let assignments = [];
      if (Array.isArray(response)) {
        assignments = response;
      } else if (response?.data) {
        assignments = Array.isArray(response.data) ? response.data : [];
      } else if (response?.data?.data) {
        assignments = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      console.log('Processed assignments:', assignments);
      setTeacherAssignments(assignments);

      // The backend returns classes with subjects, so we can use them directly
      setAvailableClasses(assignments);
      
      // Extract all unique subjects from all classes
      const allSubjects = [];
      assignments.forEach(cls => {
        if (cls && cls.subjects) {
          const subjects = Array.isArray(cls.subjects) ? cls.subjects : [];
          subjects.forEach(subject => {
            if (subject && subject.id && !allSubjects.find(s => s.id === subject.id)) {
              allSubjects.push(subject);
            }
          });
        }
      });

      setAvailableSubjects(allSubjects);
      console.log('Available classes set:', assignments);
      console.log('Available subjects set:', allSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      showError('Failed to load teacher assignments');
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      console.log('fetchAdminData - Starting...');
      setLoading(true);
      const [classesResponse, subjectsResponse] = await Promise.all([
        API.getClasses(),
        API.getSubjects()
      ]);
      
      console.log('fetchAdminData - Raw responses:', { classesResponse, subjectsResponse });
      
      // Handle different response formats
      const classes = Array.isArray(classesResponse) ? classesResponse : 
                     (classesResponse?.data && Array.isArray(classesResponse.data)) ? classesResponse.data : [];
      
      const subjects = Array.isArray(subjectsResponse) ? subjectsResponse : 
                      (subjectsResponse?.data && Array.isArray(subjectsResponse.data)) ? subjectsResponse.data : [];
      
      console.log('Admin - Classes response:', classesResponse);
      console.log('Admin - Subjects response:', subjectsResponse);
      console.log('Admin - Processed classes:', classes);
      console.log('Admin - Processed subjects:', subjects);
      console.log('Admin - Classes type:', typeof classes, 'Is array:', Array.isArray(classes));
      console.log('Admin - Subjects type:', typeof subjects, 'Is array:', Array.isArray(subjects));
      
      setAvailableClasses(classes);
      setAvailableSubjects(subjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showError('Failed to load classes and subjects');
      setLoading(false);
    }
  };

  // Fetch students when both class and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchClassStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSubject]);

  const fetchClassStudents = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    try {
      const response = await API.getStudentsForClassSubject(selectedClass, selectedSubject);
      const studentsData = response.data || response;
      setStudents(studentsData);
      
      // Load existing scores for these students - pass class and subject explicitly
      await loadStudentScores(studentsData, selectedClass, selectedSubject);
    } catch (error) {
      console.error('Error fetching class students:', error);
      showError('Failed to load students for the selected class and subject');
    }
  };

  const loadStudentScores = async (studentsList, classId = null, subjectId = null) => {
    try {
      // Use provided parameters or fall back to state (to avoid closure issues)
      const currentClass = classId || selectedClass;
      const currentSubject = subjectId || selectedSubject;
      
      console.log('Loading scores for students:', studentsList);
      console.log('Selected class:', currentClass, 'Selected subject:', currentSubject);
      
      if (!studentsList || studentsList.length === 0 || !currentClass || !currentSubject) {
        setStudentScores({});
        return;
      }
      
      // Clear scores first to prevent showing old data
      setStudentScores({});
      
      const scoresPromises = studentsList.map(student => 
        API.getStudentScores(student.id, { class_id: currentClass, subject_id: currentSubject })
      );
      
      const scoresResponses = await Promise.all(scoresPromises);
      console.log('Scores responses:', scoresResponses);
      
      const scoresMap = {};

      studentsList.forEach((student, index) => {
        const response = scoresResponses[index];
        const studentScores = response?.data || response || [];
        console.log(`Scores for student ${student.id}:`, studentScores);
        scoresMap[student.id] = {};
        
        if (Array.isArray(studentScores)) {
          studentScores.forEach(score => {
            // Verify the score belongs to the current subject to prevent cross-contamination
            if (score.subject_id == currentSubject || (score.subject && score.subject.id == currentSubject)) {
              scoresMap[student.id][score.term] = score;
            }
          });
        }
      });
      
      console.log('Final scores map:', scoresMap);
      setStudentScores(scoresMap);
    } catch (error) {
      console.error('Error loading student scores:', error);
      setStudentScores({});
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSubject('');
    setStudents([]);
    setStudentScores({});
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setStudents([]);
    setStudentScores({});
    // Close modal and clear form when subject changes to prevent showing wrong subject's data
    setShowAddForm(false);
    setEditingScore(null);
    setSelectedStudent(null);
    setScores({
      first_ca: '',
      second_ca: '',
      exam_score: '',
      total_score: '',
      grade: '',
      remark: ''
    });
  };

  const handleScoreChange = (field, value) => {
    setScores(prev => ({
      ...prev,
      [field]: field === 'first_ca' || field === 'second_ca' || field === 'exam_score' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const calculateTotal = () => {
    const testScore = parseFloat(scores.test_score) || 0;
    const examScore = parseFloat(scores.exam_score) || 0;
    return testScore + examScore;
  };

  const calculateGrade = (total) => {
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const handleSaveScore = async () => {
    if (!selectedStudent) {
      showError('Please select a student');
      return;
    }

    // Allow partial saves - at least one score field should be filled
    if (!scores.first_ca && !scores.second_ca && !scores.exam_score) {
      showError('Please fill in at least one score field');
      return;
    }

    const total = (parseFloat(scores.first_ca) || 0) + (parseFloat(scores.second_ca) || 0) + (parseFloat(scores.exam_score) || 0);
    const grade = calculateGrade(total);

    setIsSaving(true);
    try {
      const scoreData = {
        student_id: selectedStudent.id,
        subject_id: selectedSubject,
        class_id: selectedClass,
        term: term,
        first_ca: scores.first_ca ? parseFloat(scores.first_ca) : null,
        second_ca: scores.second_ca ? parseFloat(scores.second_ca) : null,
        exam_score: scores.exam_score ? parseFloat(scores.exam_score) : null,
        total_score: total,
        grade: grade,
        remark: scores.remark || ''
      };

      if (editingScore) {
        console.log('Updating score with ID:', editingScore.id);
        console.log('Score data:', scoreData);
        console.log('Current user role:', user?.role);
        console.log('Selected class:', selectedClass, 'Selected subject:', selectedSubject);
        await API.updateScore(editingScore.id, scoreData);
        showSuccess('Score updated successfully');
      } else {
        console.log('Creating new score with data:', scoreData);
        console.log('Current user role:', user?.role);
        console.log('Selected class:', selectedClass, 'Selected subject:', selectedSubject);
        await API.createScore(scoreData);
        showSuccess('Score saved successfully');
      }

      // Refresh students and scores
      await fetchClassStudents();
      
      // Reset form but keep class and subject selection
      setScores({
        first_ca: '',
        second_ca: '',
        exam_score: '',
        total_score: '',
        grade: '',
        remark: ''
      });
      setSelectedStudent(null);
      setEditingScore(null);
      setShowAddForm(false);
      
      // Show success message
      showSuccess(editingScore ? 'Score updated successfully' : 'Score saved successfully');

    } catch (error) {
      showError(error.message || 'Failed to save score');
      console.error('Error saving score:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditScore = (student, score) => {
    // Verify the score belongs to the current subject before editing
    const scoreSubjectId = score.subject_id || (score.subject && score.subject.id);
    if (scoreSubjectId != selectedSubject) {
      showError('This score does not belong to the selected subject. Please select the correct subject first.');
      return;
    }
    
    console.log('Editing score:', score);
    setSelectedStudent(student);
    setEditingScore(score);
    setScores({
      first_ca: score.first_ca || '',
      second_ca: score.second_ca || '',
      exam_score: score.exam_score || '',
      total_score: score.total_score || '',
      grade: score.grade || '',
      remark: score.remark || ''
    });
    setTerm(score.term);
    setShowAddForm(true);
    
    // Ensure the form shows the correct student
    console.log('Form opened for student:', student.first_name, student.last_name);
    console.log('Editing score data:', score);
    console.log('Current subject:', selectedSubject, 'Score subject:', scoreSubjectId);
  };

  // Load existing scores when opening form for a specific student and term
  const loadExistingScore = async (studentId, term, classId = null, subjectId = null) => {
    try {
      // Use provided parameters or fall back to state (to avoid closure issues)
      const currentClass = classId || selectedClass;
      const currentSubject = subjectId || selectedSubject;
      
      if (!currentClass || !currentSubject) {
        // Clear form if no class/subject selected
        setEditingScore(null);
        setScores({
          first_ca: '',
          second_ca: '',
          exam_score: '',
          total_score: '',
          grade: '',
          remark: ''
        });
        setTerm(term);
        return;
      }
      
      const response = await API.getStudentScores(studentId, { 
        class_id: currentClass, 
        subject_id: currentSubject 
      });
      
      const scores = response.data || response || [];
      // Find score for the term AND verify it belongs to the current subject
      const existingScore = scores.find(score => 
        score.term === term && 
        (score.subject_id == currentSubject || (score.subject && score.subject.id == currentSubject))
      );
      
      if (existingScore) {
        setEditingScore(existingScore);
        setScores({
          first_ca: existingScore.first_ca || '',
          second_ca: existingScore.second_ca || '',
          exam_score: existingScore.exam_score || '',
          total_score: existingScore.total_score || '',
          grade: existingScore.grade || '',
          remark: existingScore.remark || ''
        });
        setTerm(term);
      } else {
        setEditingScore(null);
        setScores({
          first_ca: '',
          second_ca: '',
          exam_score: '',
          total_score: '',
          grade: '',
          remark: ''
        });
        setTerm(term);
      }
    } catch (error) {
      console.error('Error loading existing score:', error);
      // If error, just set as new score
      setEditingScore(null);
      setScores({
        first_ca: '',
        second_ca: '',
        exam_score: '',
        total_score: '',
        grade: '',
        remark: ''
      });
      setTerm(term);
    }
  };



  const resetForm = () => {
    setScores({
      first_ca: '',
      second_ca: '',
      exam_score: '',
      total_score: '',
      grade: '',
      remark: ''
    });
    setSelectedStudent(null);
    setEditingScore(null);
    setShowAddForm(false);
    setTerm('first');
    
    // Refresh scores to ensure table is up to date
    if (Array.isArray(students) && students.length > 0) {
      loadStudentScores(students, selectedClass, selectedSubject);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) {
      return [];
    }
    
    if (!searchTerm || searchTerm === '') {
      return students;
    }
    
    return students.filter(student =>
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Debug logging
  console.log('ManageScores - Render state:', {
    loading,
    userRole: user?.role,
    availableClasses: availableClasses,
    availableClassesType: typeof availableClasses,
    availableClassesIsArray: Array.isArray(availableClasses),
    availableSubjects: availableSubjects,
    availableSubjectsType: typeof availableSubjects,
    availableSubjectsIsArray: Array.isArray(availableSubjects),
    students: students,
    studentsType: typeof students,
    studentsIsArray: Array.isArray(students)
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Manage Scores
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Record and manage student scores for your assigned classes and subjects.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={async () => {
              try {
                const params = {};
                if (selectedClass) params.class_id = selectedClass;
                if (term) params.term = term;
                await API.exportScores(params);
                showSuccess('Scores exported successfully');
              } catch (error) {
                showError(error.message || 'Failed to export scores');
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => {
              console.log('Opening import modal. Available classes:', availableClasses);
              setImportModal({ 
                isOpen: true, 
                importing: false,
                selectedClassId: null,
                selectedSubjectId: null
              });
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </button>
        </div>
      </div>

      {/* Current Academic Session Display */}
      {currentSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Current Academic Session: <span className="font-semibold">{currentSession.name}</span>
              </p>
              {currentTerm && (
                <p className="text-xs text-blue-700 mt-1">
                  Current Term: <span className="font-medium">{currentTerm.display_name || currentTerm.name}</span>
                </p>
              )}
            </div>
            <div className="text-xs text-blue-600">
              ✓ All scores will be recorded for this session
            </div>
          </div>
        </div>
      )}

      {/* Class and Subject Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Class and Subject</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select a class</option>
              {Array.isArray(availableClasses) && availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={!selectedClass}
            >
              <option value="">Select a subject</option>
              {selectedClass && Array.isArray(availableSubjects) && availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      {selectedClass && selectedSubject && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Students ({filteredStudents.length})
              </h3>
              <div className="flex space-x-2">
                              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                  // Clear any existing editing state
                  setEditingScore(null);
                  setSelectedStudent(null);
                  setScores({
                    first_ca: '',
                    second_ca: '',
                    exam_score: '',
                    total_score: '',
                    grade: '',
                    remark: ''
                  });
                  // Set term to current term if available
                  if (currentTerm && currentTerm.name) {
                    setTerm(currentTerm.name);
                  } else {
                    setTerm('first');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Score
              </button>
                <button
                  onClick={() => Array.isArray(students) && students.length > 0 && loadStudentScores(students, selectedClass, selectedSubject)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  title="Refresh Scores"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
          </div>
        </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Second Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Third Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const studentScore = studentScores[student.id] || {};
                return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-red-600">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                        </div>
                        </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                          </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                      </div>
                        </div>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admission_number}
                      </td>
                      {['first', 'second', 'third'].map((term) => {
                        const score = studentScore[term];
                        return (
                          <td key={term} className="px-6 py-4 whitespace-nowrap">
                            {score ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {score.total_score} ({score.grade})
                          </div>
                                <div className="text-gray-500">
                                  1st CA: {score.first_ca || 'N/A'} | 2nd CA: {score.second_ca || 'N/A'} | Exam: {score.exam_score || 'N/A'}
                        </div>
                      </div>
                    ) : (
                              <span className="text-gray-400">No score</span>
                            )}
                          </td>
                        );
                      })}
                      
                      {/* Progress Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {['first', 'second', 'third'].map((term) => {
                            const score = studentScore[term];
                            const hasScore = score && (score.first_ca || score.second_ca || score.exam_score);
                            
                            let progressColor = 'bg-red-100 text-red-800';
                            let progressText = 'Not Started';
                            
                            if (hasScore) {
                              // Calculate completion percentage for this term
                              const filledFields = [score.first_ca, score.second_ca, score.exam_score].filter(field => field !== null && field !== '').length;
                              const totalFields = 3;
                              const termProgress = (filledFields / totalFields) * 100;
                              
                              if (termProgress === 100) {
                                progressColor = 'bg-green-100 text-green-800';
                                progressText = 'Complete';
                              } else if (termProgress >= 66) {
                                progressColor = 'bg-blue-100 text-blue-800';
                                progressText = 'Almost Done';
                              } else {
                                progressColor = 'bg-yellow-100 text-yellow-800';
                                progressText = 'Partial';
                              }
                            }
                            
                            return (
                              <div key={term} className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 w-12 capitalize">{term}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      hasScore ? 
                                        (progressText === 'Complete' ? 'bg-green-500' : 
                                         progressText === 'Almost Done' ? 'bg-blue-500' : 'bg-yellow-500') 
                                        : 'bg-red-500'
                                    }`}
                                    style={{ 
                                      width: hasScore ? 
                                        `${([score.first_ca, score.second_ca, score.exam_score].filter(field => field !== null && field !== '').length / 3) * 100}%` 
                                        : '0%' 
                                    }}
                                  ></div>
                                </div>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${progressColor}`}>
                                  {progressText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Show + button only if no scores exist for this student */}
                          {Object.keys(studentScore).length === 0 && (
                            <button
                              onClick={() => {
                                // Clear form and set student when opening modal
                                setSelectedStudent(student);
                                setEditingScore(null);
                                setScores({
                                  first_ca: '',
                                  second_ca: '',
                                  exam_score: '',
                                  total_score: '',
                                  grade: '',
                                  remark: ''
                                });
                                // Set term to current term if available
                                if (currentTerm && currentTerm.name) {
                                  setTerm(currentTerm.name);
                                } else {
                                  setTerm('first');
                                }
                                setShowAddForm(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Add Score"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Show edit button for any term that has scores */}
                          {Object.keys(studentScore).length > 0 && (
                            <button
                              onClick={() => {
                                // Get the first available score to edit
                                const firstScore = Object.values(studentScore)[0];
                                handleEditScore(student, firstScore);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Score"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Score Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingScore ? 'Edit Score' : 'Add Score'}
                {selectedStudent && (
                  <span className="block text-sm text-gray-600 mt-1">
                    Student: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.admission_number})
                  </span>
                )}
                {currentSession && (
                  <span className="block text-sm text-gray-600 mt-1">
                    Academic Session: {currentSession.name}
                  </span>
                )}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term {currentTerm && (
                      <span className="text-xs text-gray-500 font-normal">
                        (Current Term: {currentTerm.display_name || currentTerm.name})
                      </span>
                    )}
                  </label>
                  <select
                    value={term}
                    onChange={(e) => {
                      const newTerm = e.target.value;
                      setTerm(newTerm);
                      // Load existing score for this term if student is selected
                      // Pass current class and subject explicitly to avoid closure issues
                      if (selectedStudent) {
                        loadExistingScore(selectedStudent.id, newTerm, selectedClass, selectedSubject);
                      }
                    }}
                    disabled={editingScore !== null}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      editingScore !== null ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                  </select>
                  {editingScore && (
                    <p className="text-xs text-gray-500 mt-1">
                      Term cannot be changed when editing an existing score
                    </p>
                  )}
                  {currentTerm && term === currentTerm.name && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ This is the current active term
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student
                  </label>
                  <select
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const student = Array.isArray(students) ? students.find(s => s.id == e.target.value) : null;
                      setSelectedStudent(student);
                      // Load existing score for this student and current term
                      if (student) {
                        loadExistingScore(student.id, term);
                      }
                    }}
                    disabled={editingScore !== null}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      editingScore !== null ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select a student</option>
                    {Array.isArray(students) && students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.admission_number})
                      </option>
                    ))}
                  </select>
                  {editingScore && (
                    <p className="text-xs text-gray-500 mt-1">
                      Student cannot be changed when editing an existing score
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      1st CA *
                  </label>
                  <input
                    type="number"
                    min="0"
                      max="100"
                      value={scores.first_ca || ''}
                      onChange={(e) => handleScoreChange('first_ca', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      2nd CA *
                  </label>
                  <input
                    type="number"
                    min="0"
                      max="100"
                      value={scores.second_ca || ''}
                      onChange={(e) => handleScoreChange('second_ca', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Score *
                  </label>
                  <input
                    type="number"
                    min="0"
                      max="100"
                      value={scores.exam_score || ''}
                      onChange={(e) => handleScoreChange('exam_score', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Score
                  </label>
                  <input
                    type="number"
                    value={(parseFloat(scores.first_ca) || 0) + (parseFloat(scores.second_ca) || 0) + (parseFloat(scores.exam_score) || 0)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={calculateGrade((parseFloat(scores.first_ca) || 0) + (parseFloat(scores.second_ca) || 0) + (parseFloat(scores.exam_score) || 0))}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                      </div>

                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remark
                  </label>
                  <textarea
                    value={scores.remark}
                    onChange={(e) => handleScoreChange('remark', e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                      </div>
            </div>

              <div className="flex justify-end space-x-3 mt-6">
              <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
                <button
                  onClick={handleSaveScore}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (editingScore ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal - Only for Teachers */}
      {importModal.isOpen && user?.role === 'teacher' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import Scores from Excel/CSV</h3>
                <button
                  onClick={() => setImportModal({ 
                    isOpen: false, 
                    importing: false, 
                    selectedClassId: null, 
                    selectedSubjectId: null 
                  })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Upload an Excel (.xlsx, .xls) or CSV file containing score data. 
                  <strong className="block mt-2">First, select a class and subject below, then download the template.</strong>
                </p>
                <button
                  onClick={async () => {
                    if (!importModal.selectedClassId || !importModal.selectedSubjectId) {
                      showError('Please select a class and subject first before downloading the template');
                      return;
                    }
                    try {
                      await API.downloadScoreTemplateTeacher(
                        importModal.selectedClassId,
                        importModal.selectedSubjectId
                      );
                      showSuccess('Template downloaded successfully');
                    } catch (error) {
                      showError(error.response?.data?.message || error.message || 'Failed to download template');
                      console.error('Template download error:', error);
                    }
                  }}
                  disabled={!importModal.selectedClassId || !importModal.selectedSubjectId}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                  title={!importModal.selectedClassId || !importModal.selectedSubjectId ? 'Please select a class and subject first' : 'Download template with pre-filled student data'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </button>
              </div>

              {/* Class Selection - Required before import */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={importModal.selectedClassId || ''}
                  onChange={(e) => {
                    const classId = e.target.value;
                    setImportModal({ 
                      ...importModal, 
                      selectedClassId: classId,
                      selectedSubjectId: '' // Clear subject when class changes
                    });
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">-- Select a class --</option>
                  {availableClasses && availableClasses.length > 0 ? (
                    availableClasses.map((classItem) => {
                      // For teachers, availableClasses already contains only their assigned classes
                      // For admins, show all classes
                      const classId = classItem.id || classItem.class?.id;
                      const className = classItem.name || classItem.class?.name;
                      
                      if (!classId || !className) {
                        console.warn('Invalid class item:', classItem);
                        return null;
                      }
                      
                      return (
                        <option key={classId} value={classId}>
                          {className}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No classes available. Please contact admin.</option>
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the class for which you want to import scores. Only students in this class will be imported.
                </p>
              </div>

              {/* Subject Selection - Required before import */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={importModal.selectedSubjectId || ''}
                  onChange={(e) => setImportModal({ 
                    ...importModal, 
                    selectedSubjectId: e.target.value 
                  })}
                  disabled={!importModal.selectedClassId}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">-- Select a subject --</option>
                  {importModal.selectedClassId && (() => {
                    // Find the selected class
                    const selectedClass = availableClasses.find(c => {
                      const classId = c.id || c.class?.id;
                      return classId == importModal.selectedClassId;
                    });
                    
                    // Get subjects from the selected class
                    const subjects = selectedClass?.subjects || [];
                    
                    // For teachers, subjects are already filtered by backend
                    // For admins, show all subjects
                    return subjects.map((subject) => {
                      const subjectId = subject.id || subject.subject?.id;
                      const subjectName = subject.name || subject.subject?.name;
                      
                      if (!subjectId || !subjectName) return null;
                      
                      return (
                        <option key={subjectId} value={subjectId}>
                          {subjectName}
                        </option>
                      );
                    });
                  })()}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {!importModal.selectedClassId 
                    ? 'Please select a class first'
                    : 'Select the subject for which you want to import scores.'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (!importModal.selectedClassId) {
                      showError('Please select a class first');
                      return;
                    }

                    if (!importModal.selectedSubjectId) {
                      showError('Please select a subject first');
                      return;
                    }

                    // Validate that students in the selected class exist
                    try {
                      const classStudents = await API.getStudentsForClassSubject(
                        importModal.selectedClassId, 
                        importModal.selectedSubjectId
                      );
                      const studentsList = classStudents.data || classStudents || [];
                      
                      if (studentsList.length === 0) {
                        showError('No students found in the selected class and subject combination. Please verify your selection.');
                        return;
                      }
                    } catch (error) {
                      showError('Failed to validate class and subject. Please check your selection.');
                      return;
                    }

                    setImportModal({ ...importModal, importing: true });
                    try {
                      const result = await API.importScoresTeacher(
                        file,
                        importModal.selectedClassId,
                        importModal.selectedSubjectId
                      );
                      setImportResults(result);
                      showSuccess(`Import completed: ${result.success_count} successful, ${result.error_count} errors`);
                      
                      // Refresh scores if class and subject are selected
                      if (selectedClass && selectedSubject && students.length > 0) {
                        loadStudentScores(students, selectedClass, selectedSubject);
                      }
                    } catch (error) {
                      showError(error.message || 'Failed to import scores');
                    } finally {
                      setImportModal({ ...importModal, importing: false });
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={importModal.importing || !importModal.selectedClassId || !importModal.selectedSubjectId}
                />
              </div>

              {importResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium text-green-600">Successfully imported: {importResults.success_count} scores</span>
                    </div>
                    {importResults.error_count > 0 && (
                      <div>
                        <span className="font-medium text-red-600">Errors: {importResults.error_count}</span>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 mb-1">
                              Row {error.row} ({error.admission_number}): {error.errors.join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importModal.importing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Importing...</span>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setImportModal({ 
                      isOpen: false, 
                      importing: false, 
                      selectedClassId: null, 
                      selectedSubjectId: null 
                    });
                    setImportResults(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageScores; 