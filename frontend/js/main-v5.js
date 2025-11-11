/**
 * Hospital Management System - Frontend v6.0 (PRODUCTION READY)
 * ================================================================
 * ✅ All Bugs Fixed + Major Enhancements
 * ✅ Better Error Handling + Loading States
 * ✅ Real-time Data Refresh
 * ✅ Enhanced UX with animations
 * ✅ Proper Auth Flow
 * ✅ Debug Mode for troubleshooting
 */

// ====================================
// 🎯 CONFIGURATION & GLOBAL STATE
// ====================================

const CONFIG = {
   API_URL:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5001/api"
      : "https://doctor-appointment-qoxg.onrender.com/api",
  STAFF_PASSWORD: "9096rohi",
  DEBUG: true,
  REFRESH_INTERVAL: 30000,
  TOKEN_KEY: "hospital_token",
  USER_KEY: "hospital_user",
};

const STATE = {
  token: null,
  currentUser: null,
  isLoggedIn: false,
  refreshTimer: null
};

// ====================================
// 🛠️ UTILITY FUNCTIONS
// ====================================

const logger = {
  info: (...args) => CONFIG.DEBUG && console.log('ℹ️ [INFO]', ...args),
  error: (...args) => CONFIG.DEBUG && console.error('❌ [ERROR]', ...args),
  success: (...args) => CONFIG.DEBUG && console.log('✅ [SUCCESS]', ...args),
  warn: (...args) => CONFIG.DEBUG && console.warn('⚠️ [WARN]', ...args)
};

// Environment check
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (!isBrowser) {
  console.log('⚠️ This script requires a browser environment.');
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { message: 'Browser-only script' };
  }
}

// Enhanced fetch with better error handling
async function fetchApi(endpoint, options = {}) {
  if (!isBrowser) return null;
  
  const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_URL}${endpoint}`;
  const token = STATE.token || localStorage.getItem(CONFIG.TOKEN_KEY);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: { ...headers, ...options.headers }
  };

  logger.info(`🌐 Fetching: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    let data;
    
    // Try to parse JSON response
    try {
      data = await response.json();
    } catch (e) {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP ${response.status}`;
      logger.error('API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    logger.success('API Response:', data);
    return data;

  } catch (err) {
    logger.error('Network/Fetch Error:', err.message);
    
    // Better error messages
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if backend is running on port 5001.');
    }
    throw err;
  }
}

// Time formatting
function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes} ${ampm}`;
}

// Date formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Loading spinner
function showLoader(container, small = false) {
  if (!container) return;
  container.innerHTML = `<div class="loader ${small ? 'small' : ''}"></div>`;
}

// Empty state
function showEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="empty-state">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <p>${message}</p>
  </div>`;
}

// Error state
function showErrorState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="error-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <p>${message}</p>
  </div>`;
}

// ====================================
// 🔐 AUTHENTICATION SYSTEM
// ====================================

function loadAuthState() {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  const userStr = localStorage.getItem(CONFIG.USER_KEY);
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      STATE.token = token;
      STATE.currentUser = user;
      STATE.isLoggedIn = true;
      logger.info('Auth state loaded:', user);
      return { token, user, isLoggedIn: true };
    } catch (e) {
      logger.error('Failed to parse user data');
      clearAuthState();
    }
  }
  
  return { token: null, user: null, isLoggedIn: false };
}

function saveAuthState(token, user) {
  localStorage.setItem(CONFIG.TOKEN_KEY, token);
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  STATE.token = token;
  STATE.currentUser = user;
  STATE.isLoggedIn = true;
  logger.success('Auth state saved');
}

function clearAuthState() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  STATE.token = null;
  STATE.currentUser = null;
  STATE.isLoggedIn = false;
  if (STATE.refreshTimer) clearInterval(STATE.refreshTimer);
  logger.info('Auth state cleared');
}

function setupGlobalAuth() {
  const { token, user, isLoggedIn } = loadAuthState();

  // Update navigation links
  const elements = {
    loginLink: document.getElementById('login-link'),
    registerLink: document.getElementById('register-link'),
    logoutLink: document.getElementById('logout-link'),
    dashboardLink: document.getElementById('dashboard-link'),
    footerLoginLink: document.getElementById('footer-login-link'),
    footerDashboardLink: document.getElementById('footer-dashboard-link'),
    heroBookBtn: document.getElementById('hero-book-btn')
  };

  if (isLoggedIn && user) {
    // Logged in state
    elements.loginLink?.style.setProperty('display', 'none');
    elements.registerLink?.style.setProperty('display', 'none');
    elements.logoutLink?.style.setProperty('display', 'inline-flex');
    
    // Set dashboard link based on role
    const dashboardUrls = {
      patient: 'dashboard.html',
      doctor: 'doctor-dashboard.html',
      admin: 'admin-dashboard.html'
    };
    
    const dashboardUrl = dashboardUrls[user.role] || 'dashboard.html';
    
    if (elements.dashboardLink) {
      elements.dashboardLink.style.display = 'inline-flex';
      elements.dashboardLink.href = dashboardUrl;
    }
    
    if (elements.footerDashboardLink) {
      elements.footerDashboardLink.style.display = 'inline';
      elements.footerDashboardLink.href = dashboardUrl;
    }
    
    if (elements.footerLoginLink) {
      elements.footerLoginLink.style.display = 'none';
    }
    
    if (elements.heroBookBtn) {
      elements.heroBookBtn.href = dashboardUrl;
    }

    // Setup logout
    if (elements.logoutLink) {
      elements.logoutLink.onclick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          clearAuthState();
          showToast('Logged out successfully', 'success');
          setTimeout(() => window.location.href = 'index.html', 1000);
        }
      };
    }
    
  } else {
    // Logged out state
    elements.loginLink?.style.setProperty('display', 'inline-flex');
    elements.registerLink?.style.setProperty('display', 'inline-flex');
    elements.logoutLink?.style.setProperty('display', 'none');
    elements.dashboardLink?.style.setProperty('display', 'none');
    
    if (elements.footerLoginLink) elements.footerLoginLink.style.display = 'inline';
    if (elements.footerDashboardLink) elements.footerDashboardLink.style.display = 'none';
    if (elements.heroBookBtn) elements.heroBookBtn.href = 'login.html';
  }

  return { token, user, isLoggedIn };
}

// ====================================
// 📝 LOGIN PAGE
// ====================================

function setupLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const roleSelect = document.getElementById('role');
  const emailGroup = document.getElementById('email-group');
  const nameGroup = document.getElementById('name-select-group');
  const nameSelect = document.getElementById('name-select');
  const message = document.getElementById('form-message');

  async function loadNamesForRole(role) {
    const endpoint = role === 'admin' ? '/users/staff' : '/users/doctors';
    try {
      nameSelect.innerHTML = '<option value="">Loading...</option>';
      const users = await fetchApi(endpoint);
      
      nameSelect.innerHTML = '<option value="">-- Select your name --</option>';
      if (Array.isArray(users) && users.length > 0) {
        users.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.email;
          opt.textContent = u.name;
          nameSelect.appendChild(opt);
        });
      } else {
        nameSelect.innerHTML = '<option value="">No users found</option>';
      }
    } catch (err) {
      showToast(`Error loading ${role}s: ${err.message}`, 'error');
      nameSelect.innerHTML = '<option value="">Error loading names</option>';
    }
  }

  function toggleFields() {
    const role = roleSelect.value;
    
    if (role === 'patient') {
      emailGroup.style.display = 'block';
      nameGroup.style.display = 'none';
      document.getElementById('email').required = true;
      nameSelect.required = false;
    } else {
      emailGroup.style.display = 'none';
      nameGroup.style.display = 'block';
      document.getElementById('email').required = false;
      nameSelect.required = true;
      loadNamesForRole(role);
    }
  }

  roleSelect.addEventListener('change', toggleFields);
  toggleFields(); // Initial setup

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const role = roleSelect.value;
    const password = document.getElementById('password').value;
    let email = '';

    if (role === 'patient') {
      email = document.getElementById('email').value;
    } else {
      email = nameSelect.value;
    }

    if (!email || !password) {
      showToast('Please fill all fields', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const data = await fetchApi('/users/login', {
        method: 'POST',
        body: JSON.stringify({ role, email, password })
      });

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      saveAuthState(data.token, data.user);
      showToast('Login successful! Redirecting...', 'success');

      // Redirect based on role
      const redirectUrls = {
        patient: 'dashboard.html',
        doctor: 'doctor-dashboard.html',
        admin: 'admin-dashboard.html'
      };

      setTimeout(() => {
        window.location.href = redirectUrls[data.user.role] || 'dashboard.html';
      }, 1000);

    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

// ====================================
// 📝 REGISTER PAGE
// ====================================

function setupRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('mobile')?.value.trim(); // <-- ✅ 'mobile' ko yahaan add karein
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validation
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const data = await fetchApi('/users/register', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          email, 
          mobile, // <-- ✅ 'mobile' ko yahaan add karein
          password, 
          role: 'patient' 
        })
      });

      if (!data.token) {
        throw new Error('Registration failed - no token received');
      }

      // Save auth and redirect
      saveAuthState(data.token, data);
      showToast('Account created successfully!', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

// ====================================
// 🏥 PATIENT DASHBOARD
// ====================================

function setupPatientDashboard(token, user) {
  logger.info('Setting up Patient Dashboard for:', user);

  const welcome = document.getElementById('welcome-message');
  if (welcome) welcome.textContent = `Welcome, ${user.name}!`;

  // Load all sections
  loadDoctorsDropdown();
  loadPatientAppointments(token, user._id);
  loadPatientHistory(token, user._id);
  setupBookingForm(token, user);

  // Auto-refresh appointments
  STATE.refreshTimer = setInterval(() => {
    logger.info('Auto-refreshing appointments...');
    loadPatientAppointments(token, user._id);
  }, CONFIG.REFRESH_INTERVAL);
}

async function loadDoctorsDropdown() {
  const select = document.getElementById('doctor-select');
  if (!select) return;

  select.innerHTML = '<option value="">Loading doctors...</option>';
  
  try {
    const doctors = await fetchApi('/users/doctors');
    
    if (!Array.isArray(doctors) || doctors.length === 0) {
      select.innerHTML = '<option value="">No doctors available</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Select Doctor --</option>';
    doctors.forEach(doc => {
      const opt = document.createElement('option');
      opt.value = doc._id;
      opt.textContent = `Dr. ${doc.name}${doc.specialty ? ` (${doc.specialty})` : ''}`;
      select.appendChild(opt);
    });

  } catch (err) {
    showToast(`Error loading doctors: ${err.message}`, 'error');
    select.innerHTML = '<option value="">Error loading doctors</option>';
  }
}

async function loadPatientAppointments(token, userId) {
  const container = document.getElementById('appointments-list');
  if (!container) return;

  showLoader(container);

  try {
    const appointments = await fetchApi('/appointments', { 
      headers: { Authorization: `Bearer ${token}` } 
    });

    if (!Array.isArray(appointments) || appointments.length === 0) {
      showEmptyState(container, 'No appointments booked yet.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = appointments.map(appt => {
      const apptDate = new Date(appt.date);
      const isCancellable = appt.status !== 'Cancelled' && apptDate >= today;
      
      return `
        <div class="appointment-item status-${appt.status.toLowerCase()}">
          <div class="appointment-header">
            <div class="doctor-info">
              <h4>Dr. ${appt.doctorId?.name || 'Unknown'}</h4>
              <p class="specialty">${appt.doctorId?.specialty || ''}</p>
            </div>
            <span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span>
          </div>
          <div class="appointment-details">
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${formatDate(appt.date)}</span>
            </div>
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${formatTime(appt.time)}</span>
            </div>
          </div>
          ${isCancellable ? `
            <button class="btn btn-danger btn-sm btn-cancel" data-id="${appt._id}">
              Cancel Appointment
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach cancel handlers
    container.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.onclick = async (e) => {
        const apptId = e.target.dataset.id;
        if (!confirm('This consultation time was reserved specifically for you. Please be mindful of the doctor\'s valuable time. \n\nAre you sure you wish to cancel?')) return;

        try {
          await fetchApi(`/appointments/cancel/${apptId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          
          showToast('Appointment cancelled successfully', 'success');
          loadPatientAppointments(token, userId);
          loadTimeSlots(token); // Refresh available slots
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      };
    });

  } catch (err) {
    logger.error('Failed to load appointments:', err);
    showErrorState(container, `Error loading appointments: ${err.message}`);
  }
}

async function loadPatientHistory(token, patientId) {
  const container = document.getElementById('medical-history-list');
  if (!container) return;

  showLoader(container);

  try {
    const response = await fetchApi(`/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const records = response?.records || [];

    if (records.length === 0) {
      showEmptyState(container, 'No medical history available.');
      return;
    }

    container.innerHTML = records.map(record => `
      <div class="history-item">
        <div class="history-header">
          <h4>${record.diagnosis || 'Medical Record'}</h4>
          <span class="date">${formatDate(record.date)}</span>
        </div>
        <div class="history-body">
          <p><strong>Treated by:</strong> Dr. ${record.treatedByDoctor?.name || 'N/A'}</p>
          ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    logger.error('Failed to load history:', err);
    showErrorState(container, `Error loading medical history: ${err.message}`);
  }
}

function setupBookingForm(token, user) {
  const form = document.getElementById('booking-form');
  if (!form) return;

  const doctorSelect = document.getElementById('doctor-select');
  const dateInput = document.getElementById('date-input');
  const timeGrid = document.getElementById('time-slot-grid');
  const selectedTimeInput = document.getElementById('selected-time-slot') || createHiddenInput();

  function createHiddenInput() {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.id = 'selected-time-slot';
    form.appendChild(input);
    return input;
  }

  // Set minimum date to today
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Load slots when doctor or date changes
  doctorSelect?.addEventListener('change', () => loadTimeSlots(token));
  dateInput?.addEventListener('change', () => loadTimeSlots(token));

  // Time slot selection
  if (timeGrid) {
    timeGrid.onclick = (e) => {
      const btn = e.target.closest('.time-slot');
      if (!btn || btn.disabled) return;

      timeGrid.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTimeInput.value = btn.dataset.time;
    };
  }

  // Form submission
  form.onsubmit = async (e) => {
    e.preventDefault();

    const doctorId = doctorSelect.value;
    const date = dateInput.value;
    const time = selectedTimeInput.value;

    if (!doctorId || !date || !time) {
      showToast('Please select doctor, date, and time slot', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';

    try {
      await fetchApi('/appointments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId, patientId: user._id, date, time })
      });

      showToast('Appointment booked successfully!', 'success');
      
      // Reset form and refresh
      form.reset();
      selectedTimeInput.value = '';
      timeGrid.innerHTML = '<div class="slot-placeholder">Select a doctor and date to see available slots</div>';
      
      loadPatientAppointments(token, user._id);

    } catch (err) {
      showToast(`Booking failed: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book Appointment';
      loadTimeSlots(token); // Refresh slots
    }
  };
}

async function loadTimeSlots(token) {
  const doctorSelect = document.getElementById('doctor-select');
  const dateInput = document.getElementById('date-input');
  const grid = document.getElementById('time-slot-grid');
  
  if (!doctorSelect || !dateInput || !grid) return;

  const doctorId = doctorSelect.value;
  const date = dateInput.value;

  if (!doctorId || !date) {
    grid.innerHTML = '<div class="slot-placeholder">Please select a doctor and date</div>';
    return;
  }

  showLoader(grid, true);

  try {
    const bookedTimes = await fetchApi(
      `/appointments/booked?doctorId=${doctorId}&date=${date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30'
    ];

    const booked = Array.isArray(bookedTimes) ? bookedTimes : [];

    grid.innerHTML = allSlots.map(time => {
      const isBooked = booked.includes(time);
      return `
        <button type="button" 
                class="time-slot ${isBooked ? 'booked' : ''}" 
                data-time="${time}"
                ${isBooked ? 'disabled' : ''}>
          ${formatTime(time)}
        </button>
      `;
    }).join('');

  } catch (err) {
    logger.error('Failed to load slots:', err);
    showErrorState(grid, 'Error loading time slots');
  }
}

// ====================================
// 👨‍⚕️ DOCTOR DASHBOARD
// ====================================

function setupDoctorDashboard(token, user) {
  logger.info('Setting up Doctor Dashboard for:', user);

  const welcome = document.getElementById('welcome-message');
  if (welcome) welcome.textContent = `Welcome, Dr. ${user.name}!`;

  loadDoctorAppointments(token, user._id);
  setupHistoryModal(token);

  // Auto-refresh
  STATE.refreshTimer = setInterval(() => {
    logger.info('Auto-refreshing doctor appointments...');
    loadDoctorAppointments(token, user._id);
  }, CONFIG.REFRESH_INTERVAL);
}

async function loadDoctorAppointments(token, doctorId) {
  const container = document.getElementById('doctor-appointments-list');
  if (!container) return;

  showLoader(container);

  try {
    const appointments = await fetchApi('/appointments/doctor', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!Array.isArray(appointments) || appointments.length === 0) {
      showEmptyState(container, 'No upcoming appointments');
      return;
    }

    container.innerHTML = appointments.map(appt => `
      <div class="doctor-appointment-item">
        <div class="patient-info">
        
          <div class="avatar" style="display: flex; justify-content: center; align-items: center; padding: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div class="details">
            <h4>${appt.patientId?.name || 'Unknown Patient'}</h4>
            
            <p style="font-size: 0.9rem; color: #6c757d; display: flex; align-items: center; gap: 6px; margin-top: 4px; margin-bottom: 4px;">
                <i data-feather="mail" style="width:14px; height:14px;"></i>
                ${appt.patientId?.email || 'No Email'}
            </p>

            <p style="font-size: 0.9rem; color: #6c757d; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <i data-feather="phone" style="width:14px; height:14px;"></i>
                ${appt.patientId?.mobile || 'No Mobile'}
            </p>
            <p>${formatDate(appt.date)} at ${formatTime(appt.time)}</p>
            <span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm btn-history" 
                data-patient-id="${appt.patientId?._id}" 
                data-patient-name="${appt.patientId?.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          View History
        </button>
      </div>
    `).join('');

    // Icon render karne ke liye
    if (window.feather) {
      window.feather.replace();
    }

    // Attach history button handlers
    container.querySelectorAll('.btn-history').forEach(btn => {
      btn.onclick = () => {
        const patientId = btn.dataset.patientId;
        const patientName = btn.dataset.patientName;
        showHistoryModal(token, patientId, patientName);
      };
    });

  } catch (err) {
    logger.error('Failed to load doctor appointments:', err);
    showErrorState(container, `Error loading appointments: ${err.message}`);
  }
}

function setupHistoryModal(token) {
  const modal = document.getElementById('history-modal');
  const closeBtn = document.getElementById('history-modal-close-btn');
  const form = document.getElementById('add-history-form');

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
      form?.reset();
    };
  }

  // Close on backdrop click
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        form?.reset();
      }
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const patientId = document.getElementById('history-patient-id').value;
      const diagnosis = document.getElementById('diagnosis').value.trim();
      const notes = document.getElementById('notes').value.trim();

      if (!diagnosis) {
        showToast('Please enter diagnosis', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding...';

      try {
        await fetchApi(`/history/${patientId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ diagnosis, notes })
        });

        showToast('Medical record added successfully', 'success');
        form.reset();
        
        // Refresh history list
        loadPastHistory(token, patientId);

      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Record';
      }
    };
  }
}

async function loadPastHistory(token, patientId) {
  const container = document.getElementById('past-history-list');
  if (!container) return;

  showLoader(container, true);

  try {
    
    // "Body is disturbed" wala Bug Fix (Pichhle step se)
    const response = await fetchApi(`/history?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const records = response?.records || [];

    if (records.length === 0) {
      showEmptyState(container, 'No medical history found for this patient');
      return;
    }

    container.innerHTML = records.map(record => `
      <div class="history-item">
        <div class="history-header">
          <h4>${record.diagnosis}</h4>
          <span class="date">${formatDate(record.date)}</span>
        </div>
        <div class="history-body">
          <p><strong>Doctor:</strong> ${record.treatedByDoctor?.name || 'N/A'}</p>
          ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    logger.error('Failed to load patient history:', err);
    showErrorState(container, `Error: ${err.message}`);
  }
}

function showHistoryModal(token, patientId, patientName) {
  const modal = document.getElementById('history-modal');
  if (!modal) return;

  const titleEl = document.getElementById('modal-patient-name');
  const idInput = document.getElementById('history-patient-id');

  if (titleEl) titleEl.textContent = `Medical History - ${patientName}`;
  if (idInput) idInput.value = patientId;

  loadPastHistory(token, patientId);
  modal.style.display = 'flex';
}

// ====================================
// 🏢 ADMIN DASHBOARD
// ====================================

function setupAdminDashboard(token, user) {
  logger.info('Setting up Admin Dashboard for:', user);

  const welcome = document.getElementById('welcome-message');
  if (welcome) welcome.textContent = `Welcome, ${user.name} (Admin)`;

  loadAllAppointments(token);
  loadAllUsers(token);

  // Auto-refresh
  STATE.refreshTimer = setInterval(() => {
    logger.info('Auto-refreshing admin data...');
    loadAllAppointments(token);
    loadAllUsers(token);
  }, CONFIG.REFRESH_INTERVAL);
}

async function loadAllAppointments(token) {
  const container = document.getElementById('admin-appointments-list');
  if (!container) return;

  showLoader(container);

  try {
    const appointments = await fetchApi('/appointments/admin', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!Array.isArray(appointments) || appointments.length === 0) {
      showEmptyState(container, 'No appointments in the system');
      return;
    }

    // Group by status
    const grouped = {
      Pending: [],
      Confirmed: [],
      Completed: [],
      Cancelled: []
    };

    appointments.forEach(appt => {
      if (grouped[appt.status]) {
        grouped[appt.status].push(appt);
      }
    });

    container.innerHTML = Object.entries(grouped).map(([status, appts]) => {
      if (appts.length === 0) return '';
      
      return `
        <div class="status-group">
          <h3 class="group-title">
            ${status} Appointments (${appts.length})
          </h3>
          <div class="appointments-grid">
            ${appts.map(a => `
              <div class="admin-appointment-card">
                <div class="card-header">
                  <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                  <span class="date">${formatDate(a.date)}</span>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><strong>Patient:</strong> ${a.patientId?.name || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <span><strong>Doctor:</strong> Dr. ${a.doctorId?.name || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${formatTime(a.time)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    logger.error('Failed to load all appointments:', err);
    showErrorState(container, `Error loading appointments: ${err.message}`);
  }
}

async function loadAllUsers(token) {
  const container = document.getElementById('admin-users-list');
  if (!container) return;

  showLoader(container);

  try {
    const [doctors, staff, patients] = await Promise.all([
      fetchApi('/users/all-doctors', { headers: { Authorization: `Bearer ${token}` } }),
      fetchApi('/users/all-staff', { headers: { Authorization: `Bearer ${token}` } }),
      fetchApi('/users/all-patients', { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const renderUserGroup = (title, users, icon) => {
      if (!Array.isArray(users) || users.length === 0) {
        return `
          <div class="user-group">
            <div class="group-header">
              ${icon}
              <h3>${title} (0)</h3>
            </div>
            <p class="empty-state">No ${title.toLowerCase()} found</p>
          </div>
        `;
      }

      return `
        <div class="user-group">
          <div class="group-header">
            ${icon}
            <h3>${title} (${users.length})</h3>
          </div>
          <div class="users-grid">
            ${users.map(u => `
              <div class="user-card">
                <div class="user-avatar" style="display: flex; justify-content: center; align-items: center; padding: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="user-info">
                  <h4>${u.name}</h4>
                  <p>${u.email}</p>
                  ${u.specialty ? `<span class="specialty">${u.specialty}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    const doctorIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>';
    const staffIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
    const patientIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

    container.innerHTML = 
      renderUserGroup('Doctors', doctors, doctorIcon) +
      renderUserGroup('Staff', staff, staffIcon) +
      renderUserGroup('Patients', patients, patientIcon);

  } catch (err) {
    logger.error('Failed to load users:', err);
    showErrorState(container, `Error loading users: ${err.message}`);
  }
}

// ====================================
// 🌐 PUBLIC DOCTORS PAGE
// ====================================

async function setupPublicDoctorsPage() {
  const container = document.getElementById('doctor-list-container');
  if (!container) return;

  showLoader(container);

  try {
    const doctors = await fetchApi('/users/doctors');

    if (!Array.isArray(doctors) || doctors.length === 0) {
      showEmptyState(container, 'No doctors available at the moment');
      return;
    }

    container.innerHTML = doctors.map(doc => `
      <div class="doctor-card">

        <div class="doctor-avatar" style="display: flex; justify-content: center; align-items: center; padding: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <div class="doctor-info">
          <h3>Dr. ${doc.name}</h3>
          ${doc.specialty ? `<p class="specialty">${doc.specialty}</p>` : ''}
          ${doc.email ? `<p class="email">${doc.email}</p>` : ''}
        </div>
        <a href="login.html" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Book Appointment
        </a>
      </div>
    `).join('');

    // Refresh Feather icons if available
    if (window.feather) window.feather.replace();

  } catch (err) {
    logger.error('Failed to load doctors:', err);
    showErrorState(container, `Error loading doctors: ${err.message}`);
  }
}

// ====================================
// 🚀 APP INITIALIZATION
// ====================================

if (isBrowser) {
  document.addEventListener('DOMContentLoaded', () => {
    logger.info('🚀 Hospital Management System Initialized');
    logger.info('API URL:', CONFIG.API_URL);

    // Setup global auth first
    const { token, user, isLoggedIn } = setupGlobalAuth();

    // Route protection helper
    const requireAuth = (redirectUrl = 'login.html') => {
      if (!isLoggedIn) {
        showToast('Please login to continue', 'error');
        setTimeout(() => window.location.href = redirectUrl, 1500);
        return false;
      }
      return true;
    };

    // Page-specific initialization
    try {
      if (document.getElementById('login-form')) {
        // Login Page
        logger.info('📄 Login Page');
        setupLoginPage();
      }
      else if (document.getElementById('register-form')) {
        // Register Page
        logger.info('📄 Register Page');
        setupRegisterPage();
      }
      // Pehle ka Bug Fix
      else if (document.getElementById('booking-form')) {
        // Patient Dashboard
        logger.info('📄 Patient Dashboard');
        if (requireAuth()) {
          if (user.role !== 'patient') {
            showToast('Access denied', 'error');
            setTimeout(() => window.location.href = 'index.html', 1500);
          } else {
            setupPatientDashboard(token, user);
          }
        }
      }
      else if (document.getElementById('doctor-appointments-list')) {
        // Doctor Dashboard
        logger.info('📄 Doctor Dashboard');
        if (requireAuth()) {
          if (user.role !== 'doctor') {
            showToast('Access denied', 'error');
            setTimeout(() => window.location.href = 'index.html', 1500);
          } else {
            setupDoctorDashboard(token, user);
          }
        }
      }
      else if (document.getElementById('admin-appointments-list')) {
        // Admin Dashboard
        logger.info('📄 Admin Dashboard');
        if (requireAuth()) {
          if (user.role !== 'admin') {
            showToast('Access denied', 'error');
            setTimeout(() => window.location.href = 'index.html', 1500);
          } else {
            setupAdminDashboard(token, user);
          }
        }
      }
      else if (document.getElementById('doctor-list-container')) {
        // Public Doctors Page
        logger.info('📄 Public Doctors Page');
        setupPublicDoctorsPage();
      }
      else {
        // Home or other pages
        logger.info('📄 Public Page (Home/About/Contact)');
      }

      // Initialize Feather Icons
      if (window.feather) {
        window.feather.replace();
        logger.success('Feather icons initialized');
      }

    } catch (err) {
      logger.error('Initialization error:', err);
      showToast('Something went wrong. Please refresh the page.', 'error');
    }

    logger.success('✅ App initialization complete');
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (STATE.refreshTimer) {
      clearInterval(STATE.refreshTimer);
    }
  });
}

// ====================================
// 📦 EXPORT FOR NODE.JS (if needed)
// ====================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    fetchApi,
    formatTime,
    formatDate,
    logger
  };
}