import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GraduationCap, Users, CheckCircle, XCircle } from 'lucide-react';
import API from '../services/API';
import { useNotification } from '../contexts/NotificationContext';
import { COLORS } from '../constants/colors';

const PromotionTab = () => {
  const [rules, setRules] = useState([]);
  const [activeRule, setActiveRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [promoting, setPromoting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    type: 'all_promote',
    criteria: {},
    description: '',
    is_active: false,
  });

  useEffect(() => {
    fetchRules();
    fetchSessions();
    fetchClasses();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await API.getPromotionRules();
      setRules(response.data?.data || response.data || []);
      setActiveRule(response.data?.active_rule || response.active_rule || null);
    } catch (error) {
      showError('Failed to fetch promotion rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await API.getAcademicSessions();
      const sessionsData = response.data?.data || response.data || [];
      setSessions(sessionsData);
      // Set current session as default
      const current = sessionsData.find(s => s.is_current) || sessionsData[0];
      if (current) setSelectedSession(current.id);
    } catch (error) {
      showError('Failed to fetch academic sessions');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await API.getClasses();
      const classesData = response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      showError('Failed to fetch classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await API.updatePromotionRule(editingRule.id, formData);
        showSuccess('Promotion rule updated successfully');
      } else {
        await API.createPromotionRule(formData);
        showSuccess('Promotion rule created successfully');
      }
      resetForm();
      fetchRules();
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Failed to save promotion rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      criteria: rule.criteria || {},
      description: rule.description || '',
      is_active: rule.is_active || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (rule) => {
    if (!window.confirm('Are you sure you want to delete this promotion rule?')) return;
    
    try {
      await API.deletePromotionRule(rule.id);
      showSuccess('Promotion rule deleted successfully');
      fetchRules();
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Failed to delete promotion rule');
    }
  };

  const handleActivate = async (rule) => {
    try {
      await API.updatePromotionRule(rule.id, { ...rule, is_active: true });
      showSuccess('Promotion rule activated');
      fetchRules();
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Failed to activate rule');
    }
  };

  const handlePromote = async () => {
    if (!selectedSession) {
      showError('Please select an academic session');
      return;
    }

    if (!window.confirm('This will promote eligible students and graduate JSS3/SS3 students. Continue?')) {
      return;
    }

    try {
      setPromoting(true);
      const params = {
        academic_session_id: selectedSession,
      };
      if (selectedClass) {
        params.class_id = selectedClass;
      }

      const response = await API.promoteStudents(params);
      showSuccess(
        `Promotion completed: ${response.data?.promoted || 0} promoted, ` +
        `${response.data?.repeated || 0} repeated, ${response.data?.graduated || 0} graduated`
      );
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Failed to promote students');
    } finally {
      setPromoting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'all_promote',
      criteria: {},
      description: '',
      is_active: false,
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const getRuleTypeLabel = (type) => {
    const labels = {
      all_promote: 'All Students Promote',
      minimum_grades: 'Minimum Grades Required',
      minimum_average: 'Minimum Average Score',
      minimum_subjects_passed: 'Minimum Subjects Passed',
    };
    return labels[type] || type;
  };

  const renderCriteriaFields = () => {
    if (formData.type === 'minimum_grades') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum A Grades
            </label>
            <input
              type="number"
              min="0"
              value={formData.criteria.min_a_count || 0}
              onChange={(e) => setFormData({
                ...formData,
                criteria: { ...formData.criteria, min_a_count: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum B Grades
            </label>
            <input
              type="number"
              min="0"
              value={formData.criteria.min_b_count || 0}
              onChange={(e) => setFormData({
                ...formData,
                criteria: { ...formData.criteria, min_b_count: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum C Grades
            </label>
            <input
              type="number"
              min="0"
              value={formData.criteria.min_c_count || 0}
              onChange={(e) => setFormData({
                ...formData,
                criteria: { ...formData.criteria, min_c_count: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      );
    }

    if (formData.type === 'minimum_average') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Average Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.criteria.min_average || 50}
            onChange={(e) => setFormData({
              ...formData,
              criteria: { ...formData.criteria, min_average: parseFloat(e.target.value) || 50 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      );
    }

    if (formData.type === 'minimum_subjects_passed') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Subjects Passed
          </label>
          <input
            type="number"
            min="1"
            value={formData.criteria.min_passed || 5}
            onChange={(e) => setFormData({
              ...formData,
              criteria: { ...formData.criteria, min_passed: parseInt(e.target.value) || 5 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading promotion rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Student Promotion Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set promotion rules and promote students after completing academic sessions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
          style={{ backgroundColor: COLORS.primary.red }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Promotion Rule
        </button>
      </div>

      {/* Promotion Rules List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900">Promotion Rules</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {rules.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No promotion rules found. Create one to get started.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-gray-900">{rule.name}</h5>
                      {rule.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Type: {getRuleTypeLabel(rule.type)}
                    </p>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                    {Object.keys(rule.criteria || {}).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Criteria: {JSON.stringify(rule.criteria)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!rule.is_active && (
                      <button
                        onClick={() => handleActivate(rule)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Promotion Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingRule ? 'Edit Promotion Rule' : 'Create Promotion Rule'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Standard Promotion Rule"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, criteria: {} })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all_promote">All Students Promote</option>
                <option value="minimum_grades">Minimum Grades Required</option>
                <option value="minimum_average">Minimum Average Score</option>
                <option value="minimum_subjects_passed">Minimum Subjects Passed</option>
              </select>
            </div>

            {renderCriteriaFields()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe this promotion rule..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Activate this rule
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: COLORS.primary.red }}
              >
                <Save className="inline mr-2 h-4 w-4" />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotion Execution */}
      {activeRule && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Run Promotion Process</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            After all three terms of an academic session are completed, you can run the promotion process.
            Students in JSS3 and SS3 will be marked as graduated. Other students will be promoted based on the active rule.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Session *
              </label>
              <select
                required
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select academic session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class (Optional - Leave empty to promote all classes)
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePromote}
              disabled={promoting || !selectedSession}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.primary.red }}
            >
              {promoting ? (
                <>Processing...</>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Run Promotion Process
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionTab;

