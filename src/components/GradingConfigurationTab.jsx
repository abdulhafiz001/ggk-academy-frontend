import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, CheckCircle, Star } from 'lucide-react';
import { COLORS } from '../constants/colors';
import API from '../services/API';
import { useNotification } from '../contexts/NotificationContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import debug from '../utils/debug';

const GradingConfigurationTab = () => {
    const { showSuccess, showError } = useNotification();
    const [configurations, setConfigurations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, config: null });
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        class_ids: [],
        grades: [
            { grade: 'A', min: 80, max: 100, remark: 'Excellent' },
            { grade: 'B', min: 70, max: 79, remark: 'Very Good' },
            { grade: 'C', min: 60, max: 69, remark: 'Good' },
            { grade: 'D', min: 50, max: 59, remark: 'Fair' },
            { grade: 'E', min: 40, max: 49, remark: 'Pass' },
            { grade: 'F', min: 0, max: 39, remark: 'Fail' },
        ],
        is_active: true,
        is_default: false,
    });

    useEffect(() => {
        fetchConfigurations();
        fetchClasses();
    }, []);

    const fetchConfigurations = async () => {
        try {
            const response = await API.getGradingConfigurations();
            let configsData = [];
            
            // Handle different response structures
            if (Array.isArray(response)) {
                configsData = response;
            } else if (response?.data) {
                if (Array.isArray(response.data)) {
                    configsData = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    configsData = response.data.data;
                }
            }
            
            // Ensure it's always an array
            setConfigurations(Array.isArray(configsData) ? configsData : []);
        } catch (error) {
            debug.error('Error fetching configurations:', error);
            showError('Error loading grading configurations');
            setConfigurations([]); // Set empty array on error
        } finally {
            setLoading(false);
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

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            class_ids: [],
            grades: [
                { grade: 'A', min: 80, max: 100, remark: 'Excellent' },
                { grade: 'B', min: 70, max: 79, remark: 'Very Good' },
                { grade: 'C', min: 60, max: 69, remark: 'Good' },
                { grade: 'D', min: 50, max: 59, remark: 'Fair' },
                { grade: 'E', min: 40, max: 49, remark: 'Pass' },
                { grade: 'F', min: 0, max: 39, remark: 'Fail' },
            ],
            is_active: true,
            is_default: false,
        });
        setEditingConfig(null);
        setShowAddForm(false);
    };

    const handleAddGrade = () => {
        setFormData(prev => ({
            ...prev,
            grades: [...prev.grades, { grade: '', min: 0, max: 100, remark: '' }]
        }));
    };

    const handleRemoveGrade = (index) => {
        setFormData(prev => ({
            ...prev,
            grades: prev.grades.filter((_, i) => i !== index)
        }));
    };

    const handleGradeChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            grades: prev.grades.map((grade, i) =>
                i === index ? { ...grade, [field]: field === 'min' || field === 'max' ? parseFloat(value) || 0 : value } : grade
            )
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || formData.grades.length === 0 || formData.class_ids.length === 0) {
            showError('Please fill all required fields');
            return;
        }

        // Validate grades
        for (const grade of formData.grades) {
            if (!grade.grade || grade.min < 0 || grade.max > 100 || grade.min > grade.max) {
                showError('Please ensure all grade ranges are valid (0-100)');
                return;
            }
        }

        setSubmitting(true);
        try {
            if (editingConfig) {
                await API.updateGradingConfiguration(editingConfig.id, formData);
                showSuccess('Grading configuration updated successfully');
            } else {
                await API.createGradingConfiguration(formData);
                showSuccess('Grading configuration created successfully');
            }
            fetchConfigurations();
            resetForm();
        } catch (error) {
            debug.error('Error saving configuration:', error);
            showError(error.message || 'Error saving grading configuration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (config) => {
        setFormData({
            name: config.name,
            description: config.description || '',
            class_ids: config.class_ids || [],
            grades: config.grades || [],
            is_active: config.is_active,
            is_default: config.is_default,
        });
        setEditingConfig(config);
        setShowAddForm(true);
    };

    const handleDelete = async () => {
        if (!deleteModal.config) return;

        setSubmitting(true);
        try {
            await API.deleteGradingConfiguration(deleteModal.config.id);
            showSuccess('Grading configuration deleted successfully');
            fetchConfigurations();
            setDeleteModal({ isOpen: false, config: null });
        } catch (error) {
            debug.error('Error deleting configuration:', error);
            showError(error.message || 'Error deleting grading configuration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetDefault = async (config) => {
        try {
            await API.setDefaultGradingConfiguration(config.id);
            showSuccess('Default grading configuration updated');
            fetchConfigurations();
        } catch (error) {
            debug.error('Error setting default:', error);
            showError(error.message || 'Error setting default configuration');
        }
    };

    const handleClassToggle = (classId) => {
        setFormData(prev => ({
            ...prev,
            class_ids: prev.class_ids.includes(classId)
                ? prev.class_ids.filter(id => id !== classId)
                : [...prev.class_ids, classId]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Grading Configurations</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure custom grading systems for different class groups</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
                    style={{ backgroundColor: COLORS.primary.red }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Configuration
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                            {editingConfig ? 'Edit Grading Configuration' : 'New Grading Configuration'}
                        </h4>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., JSS1-JSS3 Grading"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Optional description"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Classes *</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            {classes.map(cls => (
                                <label key={cls.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.class_ids.includes(cls.id)}
                                        onChange={() => handleClassToggle(cls.id)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">{cls.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Grade Ranges *</label>
                            <button
                                onClick={handleAddGrade}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                + Add Grade
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.grades.map((grade, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            value={grade.grade}
                                            onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                                            placeholder="Grade"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            value={grade.min}
                                            onChange={(e) => handleGradeChange(index, 'min', e.target.value)}
                                            placeholder="Min"
                                            min="0"
                                            max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            value={grade.max}
                                            onChange={(e) => handleGradeChange(index, 'max', e.target.value)}
                                            placeholder="Max"
                                            min="0"
                                            max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            value={grade.remark}
                                            onChange={(e) => handleGradeChange(index, 'remark', e.target.value)}
                                            placeholder="Remark"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        {formData.grades.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveGrade(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_default}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Set as Default</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: COLORS.primary.red }}
                        >
                            {submitting ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* Configurations List */}
            <div className="space-y-4">
                {configurations.length === 0 ? (
                    <div className="text-center py-12 border border-gray-200 rounded-lg">
                        <p className="text-gray-500">No grading configurations found. Create one to get started.</p>
                    </div>
                ) : (
                    configurations.map(config => (
                        <div key={config.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="text-lg font-semibold text-gray-900">{config.name}</h4>
                                        {config.is_default && (
                                            <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                <Star className="h-3 w-3 mr-1" />
                                                Default
                                            </span>
                                        )}
                                        {config.is_active ? (
                                            <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    {config.description && (
                                        <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                                    )}
                                    <div className="text-sm text-gray-500">
                                        <span className="font-medium">Classes:</span>{' '}
                                        {config.class_ids && config.class_ids.length > 0
                                            ? classes.filter(c => config.class_ids.includes(c.id)).map(c => c.name).join(', ')
                                            : 'None selected'}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {!config.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(config)}
                                            className="text-yellow-600 hover:text-yellow-700"
                                            title="Set as default"
                                        >
                                            <Star className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(config)}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="Edit"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    {!config.is_default && (
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, config })}
                                            className="text-red-600 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Grade Ranges Display */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                {config.grades && config.grades.map((grade, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <div className="font-semibold text-gray-900">{grade.grade}</div>
                                        <div className="text-xs text-gray-600">{grade.min}-{grade.max}</div>
                                        {grade.remark && (
                                            <div className="text-xs text-gray-500 mt-1">{grade.remark}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, config: null })}
                onConfirm={handleDelete}
                title="Delete Grading Configuration"
                message="Are you sure you want to delete this grading configuration? This action cannot be undone."
                itemName={deleteModal.config?.name}
                isLoading={submitting}
            />
        </div>
    );
};

export default GradingConfigurationTab;

