import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Save, AlertTriangle, Info } from 'lucide-react';
import { COLORS } from '../constants/colors';
import API from '../services/API';
import { useNotification } from '../contexts/NotificationContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const AcademicSessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, session: null });
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, showWarning } = useNotification();

  const [newSession, setNewSession] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await API.getAcademicSessions();
      
      let sessionsData = [];
      if (response && response.data) {
        sessionsData = Array.isArray(response.data) ? response.data : 
                     response.data.data ? response.data.data : [];
      }
      
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching academic sessions:', error);
      showError(error.response?.data?.message || 'Failed to fetch academic sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    if (!newSession.name || !newSession.start_date || !newSession.end_date) {
      showError('Please fill in all required fields');
      return;
    }

    if (new Date(newSession.end_date) <= new Date(newSession.start_date)) {
      showError('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.createAcademicSession(newSession);
      
      if (response.data.conflicting_session) {
        showWarning(`Date conflict with ${response.data.conflicting_session.name}. Please adjust dates.`);
        return;
      }

      showSuccess('Academic session created successfully');
      setNewSession({ name: '', start_date: '', end_date: '', is_current: false });
      setShowAddForm(false);
      fetchSessions();
    } catch (error) {
      if (error.response?.data?.conflicting_session) {
        showWarning(`Date conflict with ${error.response.data.conflicting_session.name}. Please adjust dates.`);
      } else {
        showError(error.response?.data?.message || 'Failed to create academic session');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (session) => {
    const currentSession = sessions.find(s => s.is_current);
    
    if (currentSession && new Date(currentSession.end_date) > new Date()) {
      const confirm = window.confirm(
        `Setting "${session.name}" as current will deactivate "${currentSession.name}" which is still active. Continue?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const response = await API.setCurrentAcademicSession(session.id);
      showSuccess(response.data.message || 'Current academic session updated');
      fetchSessions();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to set current session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrentTerm = async (termId, sessionId) => {
    setSubmitting(true);
    try {
      await API.setCurrentTerm(termId, sessionId);
      showSuccess('Current term updated');
      fetchSessions();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to set current term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTerm = async (termId, termData) => {
    setSubmitting(true);
    try {
      await API.updateTerm(termId, termData);
      showSuccess('Term updated successfully');
      fetchSessions();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteModal.session) return;

    setSubmitting(true);
    try {
      await API.deleteAcademicSession(deleteModal.session.id);
      showSuccess('Academic session deleted successfully');
      setDeleteModal({ isOpen: false, session: null });
      fetchSessions();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete academic session');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSessionName = (startDate) => {
    if (!startDate) return '';
    const year = new Date(startDate).getFullYear();
    return `${year}/${year + 1}`;
  };

  const calculateSessionStatus = (session) => {
    const today = new Date();
    const start = new Date(session.start_date);
    const end = new Date(session.end_date);

    if (session.is_current) return 'current';
    if (today < start) return 'upcoming';
    if (today > end) return 'past';
    return 'active';
  };

  const getStatusColor = (status) => {
    const colors = {
      current: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      upcoming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      past: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.past;
  };

  const isSessionEditable = (session) => {
    const status = calculateSessionStatus(session);
    return status === 'upcoming' || status === 'active';
  };

  const canDeleteSession = (session) => {
    const status = calculateSessionStatus(session);
    return status === 'upcoming' && !session.is_current;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Academic Sessions Management</h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Sessions automatically update based on dates. Manual changes override automatic updates.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
          style={{ backgroundColor: COLORS.primary.red }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Academic Session</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Name *
              </label>
              <input
                type="text"
                value={newSession.name}
                onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                placeholder="e.g., 2024/2025"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={newSession.start_date}
                onChange={(e) => {
                  const date = e.target.value;
                  setNewSession({
                    ...newSession,
                    start_date: date,
                    name: newSession.name || generateSessionName(date),
                  });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={newSession.end_date}
                onChange={(e) => setNewSession({ ...newSession, end_date: e.target.value })}
                min={newSession.start_date}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="set-current"
              checked={newSession.is_current}
              onChange={(e) => setNewSession({ ...newSession, is_current: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 focus:ring-2"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            />
            <label htmlFor="set-current" className="ml-2 text-sm text-gray-700">
              Set as current session (will override any existing current session)
            </label>
          </div>

          {newSession.is_current && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-700">
                  This will deactivate the current session and set this one as active immediately.
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleAddSession}
              disabled={!newSession.name || !newSession.start_date || !newSession.end_date || submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.primary.red }}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Session
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewSession({ name: '', start_date: '', end_date: '', is_current: false });
              }}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading sessions...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No academic sessions found</h3>
              <p className="text-sm text-gray-500">Get started by adding a new academic session.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const status = calculateSessionStatus(session);
              return (
                <div key={session.id} className="bg-white shadow rounded-lg overflow-hidden border-l-4" 
                     style={{ borderLeftColor: 
                       status === 'current' ? '#10B981' : 
                       status === 'active' ? '#3B82F6' : 
                       status === 'upcoming' ? '#F59E0B' : '#6B7280' 
                     }}>
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                          <h4 className="text-lg font-semibold text-gray-900">{session.name}</h4>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          {session.is_manual && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!session.is_current && isSessionEditable(session) && (
                          <button
                            onClick={() => handleSetCurrent(session)}
                            disabled={submitting}
                            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            Set as Current
                          </button>
                        )}
                        {canDeleteSession(session) && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, session })}
                            className="text-red-600 hover:text-red-900"
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Terms</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(session.terms || []).map((term) => (
                        <div key={term.id} className={`border rounded-lg p-4 ${
                          term.is_current ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{term.display_name}</span>
                              {term.is_current && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Current
                                </span>
                              )}
                            </div>
                            {!term.is_current && session.is_current && (
                              <button
                                onClick={() => handleSetCurrentTerm(term.id, session.id)}
                                disabled={submitting}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                              >
                                Set Current
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Start: {new Date(term.start_date).toLocaleDateString()}</div>
                            <div>End: {new Date(term.end_date).toLocaleDateString()}</div>
                          </div>
                          <button
                            onClick={() => {
                              const newStart = prompt('Enter new start date (YYYY-MM-DD):', term.start_date);
                              const newEnd = prompt('Enter new end date (YYYY-MM-DD):', term.end_date);
                              if (newStart && newEnd) {
                                handleUpdateTerm(term.id, {
                                  start_date: newStart,
                                  end_date: newEnd,
                                });
                              }
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit Dates
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, session: null })}
        onConfirm={handleDeleteSession}
        title="Delete Academic Session"
        message="Are you sure you want to delete this academic session? This action cannot be undone. Sessions with associated scores cannot be deleted."
        itemName={deleteModal.session?.name}
        isLoading={submitting}
      />
    </div>
  );
};

export default AcademicSessionsTab;