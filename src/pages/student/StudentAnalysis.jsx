import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import API from '../../services/API';

const StudentAnalysis = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [analysisType, setAnalysisType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAnalysisData();
    }
  }, [user]);

  const [currentSession, setCurrentSession] = useState(null);
  const [admissionSession, setAdmissionSession] = useState(null);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await API.getStudentResults();
      const responseData = response.data || response;
      const results = responseData.results || {};
      
      // Set current session and admission info
      if (responseData.current_session) {
        setCurrentSession(responseData.current_session);
      }
      if (responseData.admission_session) {
        setAdmissionSession(responseData.admission_session);
      }
      
      // Process the data to create analysis information
      const processedData = processAnalysisData(results);
      setAnalysisData(processedData);
      
      // Set default selected subject to the first available subject
      if (processedData.subjects.length > 0) {
        setSelectedSubject(processedData.subjects[0]);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalysisData = (results) => {
    // Results now grouped by session then term: { "2024/2025": { "First Term": [...], "Second Term": [...] } }
    // Flatten all terms across all sessions for comparison
    const allTermsData = [];
    Object.entries(results).forEach(([session, sessionResults]) => {
      Object.entries(sessionResults).forEach(([term, termResults]) => {
        allTermsData.push({
          key: `${session} - ${term}`,
          session,
          term,
          results: termResults || []
        });
      });
    });
    
    // Sort by session and term to get chronological order
    allTermsData.sort((a, b) => {
      if (a.session !== b.session) return a.session.localeCompare(b.session);
      const termOrder = { 'First Term': 1, 'Second Term': 2, 'Third Term': 3 };
      return (termOrder[a.term] || 0) - (termOrder[b.term] || 0);
    });
    
    if (allTermsData.length < 2) {
      return {
        subjects: [],
        subjectAnalysis: {},
        overallTrend: 'insufficient_data',
        strengths: [],
        weaknesses: [],
        improvements: [],
        concerns: []
      };
    }

    // Get the last two terms for comparison
    const currentTermData = allTermsData[allTermsData.length - 1];
    const previousTermData = allTermsData[allTermsData.length - 2];
    
    const currentTermResults = currentTermData.results || [];
    const previousTermResults = previousTermData.results || [];
    const currentTerm = currentTermData.key;
    const previousTerm = previousTermData.key;

    // Create subject mapping for comparison
    const subjectMap = {};
    
    // Process current term results
    currentTermResults.forEach(result => {
      const subjectName = result.subject?.name || 'Unknown Subject';
      const firstCA = parseFloat(result.first_ca) || 0;
      const secondCA = parseFloat(result.second_ca) || 0;
      const exam = parseFloat(result.exam_score) || 0;
      const total = firstCA + secondCA + exam;
      
      subjectMap[subjectName] = {
        currentTerm: {
          subject: subjectName,
          firstTest: firstCA,
          secondTest: secondCA,
          exam: exam,
          total: total,
          grade: calculateGrade(total),
          percentage: total
        }
      };
    });

    // Process previous term results and calculate improvements
    previousTermResults.forEach(result => {
      const subjectName = result.subject?.name || 'Unknown Subject';
      const firstCA = parseFloat(result.first_ca) || 0;
      const secondCA = parseFloat(result.second_ca) || 0;
      const exam = parseFloat(result.exam_score) || 0;
      const total = firstCA + secondCA + exam;
      
      if (subjectMap[subjectName]) {
        subjectMap[subjectName].previousTerm = {
          subject: subjectName,
          firstTest: firstCA,
          secondTest: secondCA,
          exam: exam,
          total: total,
          grade: calculateGrade(total),
          percentage: total
        };
        
        // Calculate improvement
        const improvement = total - subjectMap[subjectName].currentTerm.total;
        subjectMap[subjectName].improvement = improvement;
        subjectMap[subjectName].improvementPercentage = improvement;
      }
    });

    // Generate analysis
    const analysis = generateAnalysis(subjectMap, currentTerm, previousTerm);
    
    return {
      subjects: Object.keys(subjectMap),
      subjectAnalysis: subjectMap,
      currentTerm,
      previousTerm,
      ...analysis
    };
  };

  const calculateGrade = (total) => {
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const generateAnalysis = (subjectMap, currentTerm, previousTerm) => {
    const analysis = {
      overallTrend: '',
      strengths: [],
      weaknesses: [],
      improvements: [],
      concerns: []
    };

    // Calculate overall trends
    let totalCurrent = 0;
    let totalPrevious = 0;
    let subjectCount = 0;

    Object.values(subjectMap).forEach(subjectData => {
      if (subjectData.currentTerm && subjectData.previousTerm) {
        totalCurrent += subjectData.currentTerm.total;
        totalPrevious += subjectData.previousTerm.total;
        subjectCount++;
      }
    });

    if (subjectCount > 0) {
      const currentAvg = totalCurrent / subjectCount;
      const previousAvg = totalPrevious / subjectCount;
      const overallImprovement = currentAvg - previousAvg;

      if (overallImprovement > 5) {
        analysis.overallTrend = 'significant_improvement';
      } else if (overallImprovement > 0) {
        analysis.overallTrend = 'moderate_improvement';
      } else if (overallImprovement > -5) {
        analysis.overallTrend = 'stable';
      } else {
        analysis.overallTrend = 'declining';
      }
    } else {
      analysis.overallTrend = 'insufficient_data';
    }

    // Analyze each subject
    Object.entries(subjectMap).forEach(([subjectName, subjectData]) => {
      if (subjectData.currentTerm && subjectData.previousTerm) {
        const currentTotal = subjectData.currentTerm.total;
        const improvement = subjectData.improvement;

        // Categorize performance
        if (currentTotal >= 70) {
          analysis.strengths.push(subjectName);
        } else if (currentTotal >= 50) {
          analysis.weaknesses.push(subjectName);
        } else {
          analysis.concerns.push(subjectName);
        }

        // Track improvements
        if (improvement > 0) {
          analysis.improvements.push(subjectName);
        }

        // Generate recommendations
        subjectData.recommendations = generateSubjectRecommendations(subjectName, subjectData);
        subjectData.studyPlan = generateStudyPlan(subjectName, subjectData);
        subjectData.weakAreas = identifyWeakAreas(subjectData);
      }
    });

    return analysis;
  };

  const generateSubjectRecommendations = (subject, data) => {
    const recommendations = [];
    const currentTotal = data.currentTerm.total;
    const improvement = data.improvement || 0;

    // General recommendations based on performance level
    if (currentTotal < 50) {
      recommendations.push('Focus on fundamental concepts and basic understanding');
      recommendations.push('Seek additional help from teachers or tutors');
      recommendations.push('Practice with simpler problems to build confidence');
      recommendations.push('Review class notes and textbook material regularly');
    } else if (currentTotal < 65) {
      recommendations.push('Practice intermediate-level problems regularly');
      recommendations.push('Form study groups with classmates');
      recommendations.push('Complete past examination questions');
      recommendations.push('Focus on areas where you scored lowest');
    } else if (currentTotal < 80) {
      recommendations.push('Challenge yourself with advanced problems');
      recommendations.push('Help struggling classmates to reinforce your understanding');
      recommendations.push('Explore additional resources and materials');
      recommendations.push('Maintain consistent study habits');
    } else {
      recommendations.push('Continue with current study methods');
      recommendations.push('Help other students to deepen your knowledge');
      recommendations.push('Explore advanced topics and applications');
      recommendations.push('Consider participating in academic competitions');
    }

    // Subject-specific recommendations
    switch (subject) {
      case 'Mathematics':
        recommendations.push('Practice problem-solving daily');
        recommendations.push('Use visual aids and diagrams');
        recommendations.push('Focus on understanding concepts, not just memorizing');
        break;
      case 'English Language':
        recommendations.push('Read widely and regularly');
        recommendations.push('Practice writing different types of essays');
        recommendations.push('Build vocabulary systematically');
        break;
      case 'Basic Science':
        recommendations.push('Use diagrams and charts for better understanding');
        recommendations.push('Practice numerical problems regularly');
        recommendations.push('Connect concepts to real-world applications');
        break;
      default:
        recommendations.push('Review class notes and textbook material');
        recommendations.push('Practice past examination questions');
        recommendations.push('Seek clarification on difficult topics');
    }

    // Improvement-based recommendations
    if (improvement < 0) {
      recommendations.push('Analyze what changed from last term and address those factors');
      recommendations.push('Consider adjusting study schedule and environment');
      recommendations.push('Review study techniques and try new approaches');
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  };

  const generateStudyPlan = (subject, data) => {
    const plan = [];
    const currentTotal = data.currentTerm.total;

    if (currentTotal < 50) {
      plan.push({
        week: 'Week 1-2',
        focus: 'Foundation Building',
        activities: ['Review basic concepts', 'Complete remedial exercises', 'Meet with teacher for guidance'],
        timeCommitment: '1 hour daily'
      });
      plan.push({
        week: 'Week 3-4',
        focus: 'Practice & Application',
        activities: ['Solve practice questions', 'Apply concepts to simple problems', 'Self-assessment quizzes'],
        timeCommitment: '45 minutes daily'
      });
    } else if (currentTotal < 65) {
      plan.push({
        week: 'Week 1-2',
        focus: 'Skill Enhancement',
        activities: ['Practice intermediate problems', 'Group study sessions', 'Review weak areas'],
        timeCommitment: '45 minutes daily'
      });
      plan.push({
        week: 'Week 3-4',
        focus: 'Mastery & Testing',
        activities: ['Mock tests', 'Peer teaching', 'Advanced practice'],
        timeCommitment: '1 hour daily'
      });
    } else {
      plan.push({
        week: 'Week 1-2',
        focus: 'Excellence & Leadership',
        activities: ['Advanced problems', 'Help struggling classmates', 'Research projects'],
        timeCommitment: '30 minutes daily'
      });
      plan.push({
        week: 'Week 3-4',
        focus: 'Innovation & Exploration',
        activities: ['Creative applications', 'Independent research', 'Competitions'],
        timeCommitment: '45 minutes daily'
      });
    }

    return plan;
  };

  const identifyWeakAreas = (data) => {
    const weakAreas = [];
    const current = data.currentTerm;
    const previous = data.previousTerm;

    // Analyze different components
    if (current.firstTest < 15) weakAreas.push('First Test Performance - may indicate poor preparation or understanding');
    if (current.secondTest < 15) weakAreas.push('Second Test Performance - suggests ongoing comprehension issues');
    if (current.exam < 35) weakAreas.push('Exam Performance - needs better exam techniques and preparation');
    
    // Compare with previous term if available
    if (previous) {
      if (current.firstTest < previous.firstTest) weakAreas.push('Declining continuous assessment - focus on class participation');
      if (current.exam < previous.exam) weakAreas.push('Exam preparation needs improvement');
    }

    return weakAreas;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'significant_improvement':
        return { icon: '📈', color: 'text-green-600', text: 'Excellent Progress' };
      case 'moderate_improvement':
        return { icon: '📊', color: 'text-blue-600', text: 'Good Progress' };
      case 'stable':
        return { icon: '➖', color: 'text-yellow-600', text: 'Stable Performance' };
      case 'declining':
        return { icon: '📉', color: 'text-red-600', text: 'Needs Attention' };
      case 'insufficient_data':
        return { icon: '📊', color: 'text-gray-600', text: 'Insufficient Data' };
      default:
        return { icon: '📊', color: 'text-gray-600', text: 'Unknown' };
    }
  };

  const getPerformanceColor = (analysis) => {
    switch (analysis) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  if (!analysisData || analysisData.subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data Available</h3>
        <p className="text-gray-500">Performance analysis will appear here once you have results from multiple terms</p>
      </div>
    );
  }

  const trendData = getTrendIcon(analysisData.overallTrend);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Analysis</h1>
              <p className="mt-1 text-lg text-gray-600">
                AI-powered insights and improvement recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAnalysisType('overview')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    analysisType === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setAnalysisType('subject')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    analysisType === 'subject' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  By Subject
                </button>
                <button
                  onClick={() => setAnalysisType('actionplan')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    analysisType === 'actionplan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Action Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8 border border-indigo-200">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </h2>
              <p className="text-gray-600">{user?.school_class?.name || 'Loading...'} • Current Session: {currentSession?.name || 'Not Set'}</p>
              {admissionSession && (
                <p className="text-xs text-gray-500 mt-1">
                  Admitted: {admissionSession.name}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Analyzing: {analysisData.previousTerm} → {analysisData.currentTerm}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-2">{trendData.icon}</div>
              <p className={`font-semibold ${trendData.color}`}>{trendData.text}</p>
            </div>
          </div>
        </div>

        {/* Overview Analysis */}
        {analysisType === 'overview' && (
          <div className="space-y-8">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Strengths</h3>
                <div className="text-2xl font-bold text-green-600 mb-2">{analysisData.strengths.length}</div>
                <div className="space-y-1">
                  {analysisData.strengths.slice(0, 2).map(subject => (
                    <p key={subject} className="text-sm text-gray-600">{subject}</p>
                  ))}
                  {analysisData.strengths.length > 2 && (
                    <p className="text-xs text-gray-500">+{analysisData.strengths.length - 2} more</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Improvements</h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">{analysisData.improvements.length}</div>
                <div className="space-y-1">
                  {analysisData.improvements.slice(0, 2).map(subject => (
                    <p key={subject} className="text-sm text-gray-600">{subject}</p>
                  ))}
                  {analysisData.improvements.length > 2 && (
                    <p className="text-xs text-gray-500">+{analysisData.improvements.length - 2} more</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Needs Work</h3>
                <div className="text-2xl font-bold text-yellow-600 mb-2">{analysisData.weaknesses.length}</div>
                <div className="space-y-1">
                  {analysisData.weaknesses.slice(0, 2).map(subject => (
                    <p key={subject} className="text-sm text-gray-600">{subject}</p>
                  ))}
                  {analysisData.weaknesses.length > 2 && (
                    <p className="text-xs text-gray-500">+{analysisData.weaknesses.length - 2} more</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Priority Focus</h3>
                <div className="text-2xl font-bold text-red-600 mb-2">{analysisData.concerns.length}</div>
                <div className="space-y-1">
                  {analysisData.concerns.slice(0, 2).map(subject => (
                    <p key={subject} className="text-sm text-gray-600">{subject}</p>
                  ))}
                  {analysisData.concerns.length > 2 && (
                    <p className="text-xs text-gray-500">+{analysisData.concerns.length - 2} more</p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Comparison Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Term-by-Term Performance Comparison</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(analysisData.subjectAnalysis).map(([subject, data]) => {
                    if (!data.previousTerm) return null;
                    
                    const improvement = data.improvement || 0;
                    const currentGrade = data.currentTerm.grade;
                    const previousGrade = data.previousTerm.grade;
                    
                    return (
                      <div key={subject} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{subject}</h4>
                          <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                              {currentGrade}
                            </span>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {improvement >= 0 ? '+' : ''}{improvement}
                              </p>
                              <p className="text-xs text-gray-500">
                                {previousGrade} → {currentGrade}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{analysisData.previousTerm}</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gray-400 h-2 rounded-full"
                                  style={{ width: `${data.previousTerm.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{data.previousTerm.total}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{analysisData.currentTerm}</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${improvement >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${data.currentTerm.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{data.currentTerm.total}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject-by-Subject Analysis */}
        {analysisType === 'subject' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Subject Analysis</h3>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>All Subjects</option>
                    {analysisData.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-6">
                {selectedSubject === 'All Subjects' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysisData.subjects.map(subject => {
                      const data = analysisData.subjectAnalysis[subject];
                      if (!data.previousTerm) return null;
                      
                      const improvement = data.improvement || 0;
                      const performanceLevel = data.currentTerm.total >= 70 ? 'excellent' : 
                                             data.currentTerm.total >= 50 ? 'good' : 'needs_improvement';
                      
                      return (
                        <div key={subject} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{subject}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(performanceLevel)}`}>
                              {data.currentTerm.grade}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Performance Trend:</span>
                              <span className={`font-medium ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {improvement >= 0 ? 'Improving' : 'Declining'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-900">Top Recommendations:</p>
                              <ul className="space-y-1">
                                {data.recommendations?.slice(0, 3).map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {rec}
                                  </li>
                                )) || []}
                              </ul>
                            </div>
                            
                            <button 
                              onClick={() => setSelectedSubject(subject)}
                              className="w-full mt-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                              View Detailed Analysis
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {analysisData.subjectAnalysis[selectedSubject] && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">{selectedSubject} - Detailed Analysis</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {analysisData.subjectAnalysis[selectedSubject].currentTerm.total}
                              </div>
                              <p className="text-sm text-gray-600">Current Performance</p>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${(analysisData.subjectAnalysis[selectedSubject].improvement || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(analysisData.subjectAnalysis[selectedSubject].improvement || 0) >= 0 ? '+' : ''}{analysisData.subjectAnalysis[selectedSubject].improvement || 0}
                              </div>
                              <p className="text-sm text-gray-600">Change from Last Term</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {analysisData.subjectAnalysis[selectedSubject].currentTerm.grade}
                              </div>
                              <p className="text-sm text-gray-600">Current Grade</p>
                            </div>
                          </div>

                          {analysisData.subjectAnalysis[selectedSubject].weakAreas?.length > 0 && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-gray-900 mb-3">Areas Needing Attention:</h5>
                              <ul className="space-y-2">
                                {analysisData.subjectAnalysis[selectedSubject].weakAreas.map((area, index) => (
                                  <li key={index} className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                                    ⚠️ {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-900 mb-4">📚 Personalized Recommendations</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisData.subjectAnalysis[selectedSubject].recommendations?.map((recommendation, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                                <p className="text-sm text-blue-800">{recommendation}</p>
                              </div>
                            )) || []}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Plan */}
        {analysisType === 'actionplan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Personalized Study Action Plan</h3>
                <p className="text-sm text-gray-600 mt-1">4-week improvement strategy based on your performance analysis</p>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {analysisData.subjects
                    .filter(subject => {
                      const data = analysisData.subjectAnalysis[subject];
                      return data && data.currentTerm.total < 65;
                    })
                    .slice(0, 3)
                    .map(subject => {
                      const data = analysisData.subjectAnalysis[subject];
                      const performanceLevel = data.currentTerm.total >= 50 ? 'needs_improvement' : 'critical';
                      
                      return (
                        <div key={subject} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{subject}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(performanceLevel)}`}>
                              Priority: {performanceLevel === 'critical' ? 'High' : 'Medium'}
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {data.studyPlan?.map((week, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-gray-900">{week.week}: {week.focus}</h5>
                                  <span className="text-sm text-blue-600 font-medium">{week.timeCommitment}</span>
                                </div>
                                <ul className="space-y-1">
                                  {week.activities.map((activity, actIndex) => (
                                    <li key={actIndex} className="text-sm text-gray-600 flex items-center">
                                      <span className="text-green-500 mr-2">✓</span>
                                      {activity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )) || []}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Overall Success Tips */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4">🎯 Additional Success Tips</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-blue-800">Study Environment:</h5>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• Create a quiet, well-lit study space</li>
                        <li>• Minimize distractions (phone, TV, etc.)</li>
                        <li>• Have all materials ready before studying</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-blue-800">Study Techniques:</h5>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• Use active recall instead of just re-reading</li>
                        <li>• Take breaks every 45-60 minutes</li>
                        <li>• Teach concepts to others to reinforce learning</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalysis; 