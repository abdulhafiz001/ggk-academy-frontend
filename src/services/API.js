import debug from '../utils/debug';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        // this.token = localStorage.getItem('token'); // This line is removed
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Get headers for API requests
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Always get the latest token from localStorage
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders();
        const config = {
            headers,
            ...options,
        };

        let requestBody = undefined;
        if (options.body) {
            try {
                requestBody = JSON.parse(options.body);
            } catch {
                // If parsing fails, don't include body in debug log
            }
        }
        debug.apiRequest(url, options.method || 'GET', headers, requestBody);

        try {
            const response = await fetch(url, config);
            
            // Try to parse JSON, but handle non-JSON responses gracefully
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text || 'Request failed' };
                }
            }

            debug.apiResponse(url, response.status, data);

            if (!response.ok) {
                // Handle 401 Unauthenticated errors - redirect to login
                if (response.status === 401) {
                    // Clear authentication data
                    this.clearToken();
                    localStorage.removeItem('user');
                    
                    // Determine which login page to redirect to based on current path
                    const currentPath = window.location.pathname;
                    let loginPath = '/auth/admin/login';
                    
                    if (currentPath.startsWith('/student')) {
                        loginPath = '/auth/student/login';
                    } else if (currentPath.startsWith('/teacher') || currentPath.startsWith('/admin')) {
                        loginPath = '/auth/admin/login';
                    }
                    
                    // Redirect to login page
                    window.location.href = loginPath;
                    
                    // Create error object for any error handlers that might catch it
                    const error = new Error('Unauthenticated. Please log in again.');
                    error.response = {
                        data: { message: 'Unauthenticated. Please log in again.' },
                        status: 401,
                        statusText: 'Unauthenticated'
                    };
                    throw error;
                }
                
                // Create error object that matches expected structure
                const errorMessage = data.message || data.error || `The route ${url} could not be found.` || 'Something went wrong';
                const error = new Error(errorMessage);
                error.response = {
                    data: data,
                    status: response.status,
                    statusText: response.statusText
                };
                throw error;
            }

            return { data, status: response.status };
        } catch (error) {
            debug.apiError(url, error);
            // If it's a network error or parsing error, create a proper error structure
            if (!error.response) {
                error.response = {
                    data: { message: error.message || 'Network Error' },
                    status: 0,
                    statusText: 'Network Error'
                };
            }
            throw error;
        }
    }

    // HTTP method helpers
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return await this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // Authentication
    async login(username, password) {
        const response = await this.post('/login', { username, password });

        if (response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async studentLogin(admissionNumber, password) {
        const response = await this.post('/student/login', {
            admission_number: admissionNumber,
            password
        });

        if (response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    // Student forgot password APIs
    async verifyStudentIdentity(admissionNumberOrEmail) {
        return await this.post('/student/forgot-password/verify', {
            admission_number_or_email: admissionNumberOrEmail,
        });
    }

    async resetStudentPassword(admissionNumberOrEmail, newPassword, passwordConfirmation) {
        return await this.post('/student/forgot-password/reset', {
            admission_number_or_email: admissionNumberOrEmail,
            password: newPassword,
            password_confirmation: passwordConfirmation,
        });
    }

    async logout() {
        await this.post('/logout');
        this.clearToken();
    }

    async getUser() {
        return await this.get('/user');
    }

    // Get current user data
    async getCurrentUser() {
        return await this.request('/user');
    }

    // Check if teacher is a form teacher

    // Admin APIs
    async getAdminDashboard() {
        return await this.request('/admin/dashboard');
    }

    async getUsers() {
        return await this.request('/admin/users');
    }

    async createUser(userData) {
        return await this.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(userId, userData) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(userId, hardDelete = false) {
        const url = hardDelete
            ? `/admin/users/${userId}?hard_delete=true`
            : `/admin/users/${userId}`;
        return await this.request(url, {
            method: 'DELETE',
        });
    }

    async getTeacherAssignments() {
        return await this.request('/admin/teacher-assignments');
    }

    async assignTeacher(assignmentData) {
        return await this.request('/admin/teacher-assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData),
        });
    }

    async removeTeacherAssignment(assignmentId) {
        return await this.request(`/admin/teacher-assignments/${assignmentId}`, {
            method: 'DELETE',
        });
    }

    // Class APIs
    async getClasses() {
        return await this.request('/admin/classes');
    }

    async createClass(classData) {
        return await this.request('/admin/classes', {
            method: 'POST',
            body: JSON.stringify(classData),
        });
    }

    async updateClass(classId, classData) {
        return await this.request(`/admin/classes/${classId}`, {
            method: 'PUT',
            body: JSON.stringify(classData),
        });
    }

    async deleteClass(classId) {
        return await this.request(`/admin/classes/${classId}`, {
            method: 'DELETE',
        });
    }

    async getClass(classId) {
        return await this.request(`/admin/classes/${classId}`);
    }

    // Subject APIs
    async getSubjects() {
        return await this.request('/admin/subjects');
    }

    async getAvailableSubjects() {
        return await this.request('/teacher/subjects');
    }

    async getAllSubjects() {
        return await this.request('/teacher/subjects/all');
    }

    async createSubject(subjectData) {
        return await this.request('/admin/subjects', {
            method: 'POST',
            body: JSON.stringify(subjectData),
        });
    }

    async updateSubject(subjectId, subjectData) {
        return await this.request(`/admin/subjects/${subjectId}`, {
            method: 'PUT',
            body: JSON.stringify(subjectData),
        });
    }

    async deleteSubject(subjectId) {
        return await this.request(`/admin/subjects/${subjectId}`, {
            method: 'DELETE',
        });
    }

    async getSubject(subjectId) {
        return await this.request(`/admin/subjects/${subjectId}`);
    }

    // Student APIs
    async getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/students?${queryString}` : '/admin/students';
        return await this.request(endpoint);
    }

    async createStudent(studentData) {
        return await this.request('/admin/students', {
            method: 'POST',
            body: JSON.stringify(studentData),
        });
    }

    async updateStudent(studentId, studentData) {
        return await this.request(`/admin/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(studentData),
        });
    }

    async deleteStudent(studentId) {
        return await this.request(`/admin/students/${studentId}`, {
            method: 'DELETE',
        });
    }

    async getStudent(studentId) {
        return await this.request(`/admin/students/${studentId}`);
    }

    // Teacher APIs
    async getTeacherDashboard() {
        return await this.request('/teacher/dashboard');
    }

    async getTeacherAssignments() {
        return await this.request('/admin/teacher-assignments');
    }

    async getMyAssignments() {
        return await this.request('/teacher/assignments');
    }

    async getTeacherStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/teacher/students?${queryString}` : '/teacher/students';
        return await this.request(endpoint);
    }

    async getTeacherClasses() {
        return await this.request('/teacher/classes');
    }

    async getFormTeacherClasses() {
        return this.request('/teacher/form-teacher-classes');
    }

    async getTeacherSubjects() {
        return this.request('/teacher/subjects/all');
    }

    async addStudent(studentData) {
        return await this.request('/teacher/students', {
            method: 'POST',
            body: JSON.stringify(studentData),
        });
    }

    async updateTeacherStudent(studentId, studentData) {
        return await this.request(`/teacher/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(studentData),
        });
    }

    async deleteTeacherStudent(studentId) {
        return await this.request(`/teacher/students/${studentId}`, {
            method: 'DELETE',
        });
    }

    // Score APIs
    async getScores(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/teacher/scores?${queryString}` : '/teacher/scores';
        return await this.request(endpoint);
    }

    async getClassScores(classId) {
        return await this.request(`/teacher/scores/${classId}`);
    }

    async createScore(scoreData) {
        return await this.request('/teacher/scores', {
            method: 'POST',
            body: JSON.stringify(scoreData),
        });
    }

    async getStudentScores(studentId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `/teacher/students/${studentId}/scores?${queryString}`
            : `/teacher/students/${studentId}/scores`;
        return await this.request(endpoint);
    }

    async updateScore(scoreId, scoreData) {
        return await this.request(`/teacher/scores/${scoreId}`, {
            method: 'PUT',
            body: JSON.stringify(scoreData),
        });
    }

    async deleteScore(scoreId) {
        return await this.request(`/teacher/scores/${scoreId}`, {
            method: 'DELETE',
        });
    }

    // Enhanced Score Management APIs
    async getTeacherAssignmentsForScores() {
        return await this.request('/teacher/scores/assignments');
    }

    async getStudentsForClassSubject(classId, subjectId) {
        return await this.get('/teacher/scores/students', {
            class_id: classId,
            subject_id: subjectId
        });
    }

    async getExistingScores(classId, subjectId, term) {
        return await this.get('/teacher/scores/existing', {
            class_id: classId,
            subject_id: subjectId,
            term: term
        });
    }

    // Get scores for a specific subject that teacher is assigned to teach
    async getSubjectScores(subjectId, classId, term = null) {
        const params = {
            subject_id: subjectId,
            class_id: classId
        };
        
        if (term) {
            params.term = term;
        }
        
        return await this.get('/teacher/scores/subject', params);
    }

    // Admin Score APIs
    async getAdminScores(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/scores?${queryString}` : '/admin/scores';
        return await this.request(endpoint);
    }

    async getAdminStudentResults(studentId) {
        return await this.request(`/admin/students/${studentId}/results`);
    }

    async getTeacherActivities(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/teacher-activities?${queryString}` : '/admin/teacher-activities';
        return await this.request(endpoint);
    }

    async getAdminClassResults(classId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/classes/${classId}/results?${queryString}` : `/admin/classes/${classId}/results`;
        return await this.request(endpoint);
    }

    // Teacher Class Results API
    async getTeacherClassResults(classId) {
        return await this.request(`/teacher/classes/${classId}/results`);
    }

    // Teacher access to admin endpoints (for form teachers)
    async getTeacherAdminClasses() {
        return await this.request('/form-teacher/classes');
    }

    async getTeacherAdminScores(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/form-teacher/scores?${queryString}` : `/form-teacher/scores`;
        return await this.request(endpoint);
    }

    async getTeacherAdminClassResults(classId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/form-teacher/classes/${classId}/results?${queryString}` : `/form-teacher/classes/${classId}/results`;
        return await this.request(endpoint);
    }

    // Check if user is form teacher
    async checkFormTeacherStatus() {
        try {
            const response = await this.request('/teacher/form-teacher-status');
            return response.data?.is_form_teacher || false;
        } catch (error) {
            return false;
        }
    }

    // Teacher Individual Student Results API
    async getTeacherStudentResults(studentId) {
        return await this.request(`/teacher/students/${studentId}/results`);
    }

    // Student APIs (for student access)
    async getStudentDashboard() {
        return await this.request('/student/dashboard');
    }

    async getStudentResults() {
        return await this.request('/student/results');
    }

    async getStudentSubjects() {
        return await this.request('/student/subjects');
    }

    async getStudentProfile() {
        return await this.request('/student/profile');
    }

    async updateStudentProfile(profileData) {
        return await this.request('/student/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    // Profile Management APIs
    async getAdminProfile() {
        return await this.request('/admin/profile');
    }

    async updateAdminProfile(profileData) {
        return await this.request('/admin/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async changeAdminPassword(passwordData) {
        return await this.request('/admin/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData),
        });
    }

    async getTeacherProfile() {
        return await this.request('/teacher/profile');
    }

    async updateTeacherProfile(profileData) {
        return await this.request('/teacher/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async changeTeacherPassword(passwordData) {
        return await this.request('/teacher/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData),
        });
    }

    async changeStudentPassword(passwordData) {
        return await this.request('/student/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData),
        });
    }

    // Academic Session APIs
    async getAcademicSessions() {
        return await this.request('/admin/academic-sessions');
    }

    async getCurrentAcademicSession() {
        return await this.request('/academic-sessions/current');
    }

    async createAcademicSession(sessionData) {
        return await this.request('/admin/academic-sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData),
        });
    }

    async updateAcademicSession(sessionId, sessionData) {
        return await this.request(`/admin/academic-sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(sessionData),
        });
    }

    async deleteAcademicSession(sessionId) {
        return await this.request(`/admin/academic-sessions/${sessionId}`, {
            method: 'DELETE',
        });
    }

    async setCurrentAcademicSession(sessionId) {
        return await this.request(`/admin/academic-sessions/${sessionId}/set-current`, {
            method: 'POST',
        });
    }

    async updateTerm(termId, termData) {
        return await this.request(`/admin/terms/${termId}`, {
            method: 'PUT',
            body: JSON.stringify(termData),
        });
    }

    async setCurrentTerm(termId, academicSessionId) {
        return await this.request(`/admin/terms/${termId}/set-current`, {
            method: 'POST',
            body: JSON.stringify({ academic_session_id: academicSessionId }),
        });
    }

    // Report Generation APIs
    async generateStudentReportCard(studentId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/admin/students/${studentId}/report-card${queryString ? `?${queryString}` : ''}`;
        
        // For PDF download, we need to handle blob response
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/pdf',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate report');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `report_card_${studentId}_${params.term || 'term'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        return { success: true };
    }

    async generateStudentReportCardSelf(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/student/report-card${queryString ? `?${queryString}` : ''}`;
        
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/pdf',
            },
        });

        if (!response.ok) {
            // Check if response is JSON or HTML
            const contentType = response.headers.get('content-type');
            let errorMessage = 'Failed to generate report';
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                } else {
                    // HTML error page or other non-JSON response
                    const text = await response.text();
                    errorMessage = `Server error: ${response.status} ${response.statusText}. Please check if the endpoint exists and you have the required permissions.`;
                    debug.error('Non-JSON error response:', text.substring(0, 200));
                }
            
            throw new Error(errorMessage);
        }

        // Check if response is actually a PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            const text = await response.text();
            debug.error('Expected PDF but got:', contentType, text.substring(0, 200));
            throw new Error('Server did not return a PDF file. Please check the endpoint and try again.');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `my_report_card_${params.term || 'term'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        return { success: true };
    }

    // Bulk Import/Export APIs
    async importStudents(file, classId = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add class_id if provided
        if (classId) {
            formData.append('class_id', classId);
        }

        // Use teacher endpoint if user is a teacher, otherwise use admin endpoint
        // We'll determine this based on the user context, but for now, try teacher first
        // The backend will handle authorization
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const endpoint = user?.role === 'teacher' 
            ? '/teacher/students/import' 
            : '/admin/students/import';
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders();
        delete headers['Content-Type']; // Let browser set content-type with boundary

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': headers.Authorization,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import students');
        }

        return data;
    }

    async exportStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseURL}/admin/students/export${queryString ? `?${queryString}` : ''}`;
        const headers = this.getHeaders();
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...headers,
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                credentials: 'include',
            });
            
            // Check if response is actually an Excel file
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                // Check if response is JSON before parsing
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to export students');
                } else {
                    const text = await response.text();
                    // If it's HTML, it might be a redirect or error page
                    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                        throw new Error('Server returned an error page. Please check your authentication and try again.');
                    }
                    throw new Error(text || 'Failed to export students');
                }
            }

            // Verify it's actually an Excel file
            if (!contentType || (!contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') && 
                !contentType.includes('application/octet-stream') &&
                !contentType.includes('application/excel'))) {
                const text = await response.text();
                if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                    throw new Error('Server returned an error page. Please check your authentication and try again.');
                }
                throw new Error('Server did not return an Excel file. Please check the endpoint.');
            }

            const blob = await response.blob();
            
            // Verify blob is not empty
            if (blob.size === 0) {
                throw new Error('Received empty file from server');
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename = params.include_subjects 
                ? `students_with_subjects_export_${new Date().toISOString().split('T')[0]}.xlsx`
                : `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Wait a bit before removing to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);

            return { success: true };
        } catch (error) {
            debug.apiError(url, error);
            throw error;
        }
    }

    async exportClasses() {
        const url = `${this.baseURL}/admin/classes/export`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export classes');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export classes');
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `classes_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    async exportSubjects() {
        const url = `${this.baseURL}/admin/subjects/export`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export subjects');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export subjects');
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `subjects_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    async exportTeachers() {
        const url = `${this.baseURL}/admin/teachers/export`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export teachers');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export teachers');
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    async downloadStudentTemplate() {
        // Use teacher endpoint if user is a teacher, otherwise use admin endpoint
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const endpoint = user?.role === 'teacher' 
            ? '/teacher/students/import-template' 
            : '/admin/students/import-template';
        // Construct URL - ensure no double slashes
        const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
        const url = `${baseUrl}${endpoint}`;
        const headers = this.getHeaders();
        
        try {
            debug.log('Downloading template from:', url);
            
            // Use fetch directly but ensure proper authentication
            const authHeader = headers.Authorization || headers['Authorization'] || '';
            
            if (!authHeader) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            debug.log('Auth header for template download:', authHeader ? 'Present' : 'Missing');
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            debug.apiResponse(url, response.status, { ok: response.ok });

            if (!response.ok) {
                // Try to get error message
                const contentType = response.headers.get('content-type');
                let errorMessage = `Failed to download template (${response.status})`;
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // Not JSON, try text
                        const errorText = await response.text();
                        if (errorText && errorText.length < 500) {
                            errorMessage = errorText;
                        }
                    }
                } else {
                    const errorText = await response.text();
                    if (response.status === 404) {
                        errorMessage = 'Template endpoint not found. Please ensure you are logged in as an admin and the route exists.';
                    } else if (errorText && errorText.length < 500 && !errorText.includes('<!DOCTYPE')) {
                        errorMessage = errorText;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            debug.log('Response content type:', contentType);
            
            // Check if it's actually an Excel file or an error JSON
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to download template');
            }

            // Download the file
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'student_import_template.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return { success: true };
        } catch (error) {
            debug.apiError(url, error);
            // Re-throw with user-friendly message
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Network error. Please check your connection and ensure the server is running.');
            }
            throw error;
        }
    }

    async importScores(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/admin/scores/import`;
        const headers = this.getHeaders();
        delete headers['Content-Type'];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': headers.Authorization,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import scores');
        }

        return data;
    }

    async exportScores(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseURL}/admin/scores/export${queryString ? `?${queryString}` : ''}`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export scores');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export scores');
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `scores_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    async downloadScoreTemplate() {
        const url = `${this.baseURL}/admin/scores/import-template`;
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download template');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'score_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    async downloadScoreTemplateTeacher(classId = null, subjectId = null) {
        let url = `${this.baseURL}/teacher/scores/import-template`;
        
        // Add query parameters if class_id and subject_id are provided
        if (classId && subjectId) {
            const params = new URLSearchParams({
                class_id: classId,
                subject_id: subjectId
            });
            url += `?${params.toString()}`;
        }
        
        const headers = this.getHeaders();
        
        const response = await fetch(url, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to download template' }));
            throw new Error(error.message || 'Failed to download template');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'score_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
    }

    // Teacher import/export methods
    // Promotion Management APIs
    async getPromotionRules() {
        return await this.request('/admin/promotion-rules');
    }

    async createPromotionRule(ruleData) {
        return await this.request('/admin/promotion-rules', {
            method: 'POST',
            body: JSON.stringify(ruleData),
        });
    }

    async updatePromotionRule(ruleId, ruleData) {
        return await this.request(`/admin/promotion-rules/${ruleId}`, {
            method: 'PUT',
            body: JSON.stringify(ruleData),
        });
    }

    async deletePromotionRule(ruleId) {
        return await this.request(`/admin/promotion-rules/${ruleId}`, {
            method: 'DELETE',
        });
    }

    async promoteStudents(params) {
        return await this.request('/admin/promote-students', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // Attendance APIs (Teacher)
    async getTeacherAttendanceClasses() {
        return await this.request('/teacher/attendance/classes');
    }

    async getClassStudentsForAttendance(classId, subjectId) {
        return await this.request(`/teacher/attendance/students?class_id=${classId}&subject_id=${subjectId}`);
    }

    async markAttendance(data) {
        return await this.request('/teacher/attendance/mark', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getAttendanceRecords(params) {
        const queryParams = new URLSearchParams(params).toString();
        return await this.request(`/teacher/attendance/records?${queryParams}`);
    }

    // Attendance APIs (Admin)
    async getAttendanceStatistics(params) {
        const queryParams = new URLSearchParams(params).toString();
        return await this.request(`/admin/attendance/statistics?${queryParams}`);
    }

    async getAdminAttendanceRecords(params) {
        const queryParams = new URLSearchParams(params).toString();
        return await this.request(`/admin/attendance/records?${queryParams ? '&' + queryParams : ''}`);
    }

    // Grading Configuration APIs
    async getGradingConfigurations() {
        return await this.request('/admin/grading-configurations');
    }

    async getGradingConfiguration(id) {
        return await this.request(`/admin/grading-configurations/${id}`);
    }

    async createGradingConfiguration(data) {
        return await this.request('/admin/grading-configurations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateGradingConfiguration(id, data) {
        return await this.request(`/admin/grading-configurations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteGradingConfiguration(id) {
        return await this.request(`/admin/grading-configurations/${id}`, {
            method: 'DELETE',
        });
    }

    async setDefaultGradingConfiguration(id) {
        return await this.request(`/admin/grading-configurations/${id}/set-default`, {
            method: 'POST',
        });
    }

    async importScoresTeacher(file, classId = null, subjectId = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add class_id and subject_id if provided
        if (classId) {
            formData.append('class_id', classId);
        }
        if (subjectId) {
            formData.append('subject_id', subjectId);
        }

        const url = `${this.baseURL}/teacher/scores/import`;
        const headers = this.getHeaders();
        delete headers['Content-Type'];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': headers.Authorization,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import scores');
        }

        return data;
    }
}

export default new API();
