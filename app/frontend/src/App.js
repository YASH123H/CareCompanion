import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs';
import { Heart, Activity, Thermometer, Droplet, Moon, Clock, AlertTriangle, MessageCircle, Users, LogOut, Brain } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// AuthPage component with added Google sign-in button
const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient',
    age: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    // Redirects to backend to start Google OAuth flow
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      let payload;

      if (isLogin) {
        payload = { email: formData.email, password: formData.password };
      } else {
        payload = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role
        };
        if (formData.role === 'patient' && formData.age) {
          payload.age = parseInt(formData.age);
        }
        if (formData.role === 'doctor' && formData.specialization) {
          payload.specialization = formData.specialization;
        }
      }

      const response = await axios.post(`${API}${endpoint}`, payload);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
      toast.success(`Welcome ${response.data.user.full_name}!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <img src="https://customer-assets.emergentagent.com/job_medguardian/artifacts/em44cnqw_CC_logo.jpg" alt="CareCompanion Logo" className="brand-logo" />
          <p className="brand-tagline">Your Intelligent Recovery Partner</p>
        </div>
        <div className="auth-features">
          <div className="feature-item">
            <Activity className="feature-icon" />
            <div>
              <h3>Continuous Monitoring</h3>
              <p>Track vitals and health metrics in real-time</p>
            </div>
          </div>
          <div className="feature-item">
            <Brain className="feature-icon" />
            <div>
              <h3>AI-Powered Insights</h3>
              <p>Get personalized health recommendations</p>
            </div>
          </div>
          <div className="feature-item">
            <AlertTriangle className="feature-icon" />
            <div>
              <h3>Early Risk Detection</h3>
              <p>Proactive intervention before issues escalate</p>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <Card className="auth-card">
          <CardHeader>
            <CardTitle>{isLogin ? 'Welcome Back' : 'Get Started'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label>Full Name</label>
                  <Input
                    data-testid="full-name-input"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <Input
                  data-testid="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <Input
                  data-testid="password-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      data-testid="role-select"
                      className="role-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>
                  {formData.role === 'patient' && (
                    <div className="form-group">
                      <label>Age</label>
                      <Input
                        data-testid="age-input"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  )}
                  {formData.role === 'doctor' && (
                    <div className="form-group">
                      <label>Specialization</label>
                      <Input
                        data-testid="specialization-input"
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}
              <Button data-testid="submit-button" type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>
            {/* Google Sign-In Button */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Button variant="outline" onClick={handleGoogleSignIn}>
                Sign in with Google
              </Button>
            </div>
            <p className="auth-toggle">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button 
                data-testid="toggle-auth-button"
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="toggle-link"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// OAuthCallback component to handle backend OAuth redirect
const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthAfterOAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/oauth-user`);
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.user);
        navigate('/');
      } catch (error) {
        toast.error('Google authentication failed');
        navigate('/');
      }
    };
    fetchAuthAfterOAuth();
  }, [onLogin, navigate]);

  return <div>Signing you in...</div>;
};
const PatientDashboard = ({ user, onLogout }) => {
  const [vitals, setVitals] = useState([]);
  const [riskScore, setRiskScore] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [vitalForm, setVitalForm] = useState({
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    oxygen_saturation: '',
    sleep_hours: '',
    activity_minutes: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVitals();
    fetchRiskScore();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchVitals = async () => {
    try {
      const response = await axios.get(`${API}/vitals`, getAuthHeaders());
      setVitals(response.data);
    } catch (error) {
      toast.error('Failed to fetch vitals');
    }
  };

  const fetchRiskScore = async () => {
    try {
      const response = await axios.get(`${API}/risk-score/latest`, getAuthHeaders());
      setRiskScore(response.data);
    } catch (error) {
      console.error('Failed to fetch risk score');
    }
  };

  const handleVitalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/vitals`, vitalForm, getAuthHeaders());
      toast.success('Vitals logged successfully');
      fetchVitals();
      fetchRiskScore();
      setVitalForm({
        heart_rate: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        temperature: '',
        oxygen_saturation: '',
        sleep_hours: '',
        activity_minutes: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to log vitals');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory([...chatHistory, { type: 'user', text: userMsg }]);
    setChatMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, { message: userMsg }, getAuthHeaders());
      setChatHistory(prev => [...prev, { type: 'ai', text: response.data.response }]);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = () => {
    if (!riskScore) return '#10b981';
    switch (riskScore.risk_level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="https://customer-assets.emergentagent.com/job_medguardian/artifacts/em44cnqw_CC_logo.jpg" alt="CareCompanion" className="nav-logo" />
        </div>
        <div className="nav-user">
          <span className="user-name">{user.full_name}</span>
          <span className="user-role">Patient</span>
          <Button data-testid="logout-button" variant="ghost" size="sm" onClick={onLogout}>
            <LogOut size={18} />
          </Button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user.full_name.split(' ')[0]}!</h1>
          <p>Here's your health overview for today</p>
        </div>

        {riskScore && (
          <Card className="risk-card" style={{ borderColor: getRiskColor() }}>
            <CardHeader>
              <div className="risk-header">
                <div>
                  <CardTitle>Health Risk Assessment</CardTitle>
                  <CardDescription>Based on your recent vitals</CardDescription>
                </div>
                <div className="risk-score" style={{ backgroundColor: getRiskColor() }}>
                  <AlertTriangle size={24} />
                  <span>{riskScore.risk_level.toUpperCase()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="risk-details">
                <div className="risk-section">
                  <h4>Risk Factors:</h4>
                  <ul>
                    {riskScore.factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
                <div className="risk-section">
                  <h4>Recommendations:</h4>
                  <ul>
                    {riskScore.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="vitals" className="dashboard-tabs">
          <TabsList>
            <TabsTrigger data-testid="vitals-tab" value="vitals">
              <Activity size={18} />
              Vitals
            </TabsTrigger>
            <TabsTrigger data-testid="chat-tab" value="chat">
              <MessageCircle size={18} />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitals">
            <div className="vitals-grid">
              <Card className="vital-form-card">
                <CardHeader>
                  <CardTitle>Log Your Vitals</CardTitle>
                  <CardDescription>Track your health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVitalSubmit} className="vital-form">
                    <div className="vital-input-group">
                      <Heart className="input-icon" />
                      <Input
                        data-testid="heart-rate-input"
                        type="number"
                        placeholder="Heart Rate (bpm)"
                        value={vitalForm.heart_rate}
                        onChange={(e) => setVitalForm({ ...vitalForm, heart_rate: e.target.value })}
                      />
                    </div>
                    <div className="vital-input-row">
                      <div className="vital-input-group">
                        <Droplet className="input-icon" />
                        <Input
                          data-testid="bp-systolic-input"
                          type="number"
                          placeholder="BP Systolic"
                          value={vitalForm.blood_pressure_systolic}
                          onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure_systolic: e.target.value })}
                        />
                      </div>
                      <div className="vital-input-group">
                        <Input
                          data-testid="bp-diastolic-input"
                          type="number"
                          placeholder="BP Diastolic"
                          value={vitalForm.blood_pressure_diastolic}
                          onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure_diastolic: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="vital-input-group">
                      <Thermometer className="input-icon" />
                      <Input
                        data-testid="temperature-input"
                        type="number"
                        step="0.1"
                        placeholder="Temperature (°C)"
                        value={vitalForm.temperature}
                        onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                      />
                    </div>
                    <div className="vital-input-group">
                      <Activity className="input-icon" />
                      <Input
                        data-testid="oxygen-input"
                        type="number"
                        placeholder="Oxygen Saturation (%)"
                        value={vitalForm.oxygen_saturation}
                        onChange={(e) => setVitalForm({ ...vitalForm, oxygen_saturation: e.target.value })}
                      />
                    </div>
                    <div className="vital-input-group">
                      <Moon className="input-icon" />
                      <Input
                        data-testid="sleep-input"
                        type="number"
                        step="0.5"
                        placeholder="Sleep (hours)"
                        value={vitalForm.sleep_hours}
                        onChange={(e) => setVitalForm({ ...vitalForm, sleep_hours: e.target.value })}
                      />
                    </div>
                    <div className="vital-input-group">
                      <Clock className="input-icon" />
                      <Input
                        data-testid="activity-input"
                        type="number"
                        placeholder="Activity (minutes)"
                        value={vitalForm.activity_minutes}
                        onChange={(e) => setVitalForm({ ...vitalForm, activity_minutes: e.target.value })}
                      />
                    </div>
                    <Input
                      data-testid="notes-input"
                      placeholder="Notes (optional)"
                      value={vitalForm.notes}
                      onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                    />
                    <Button data-testid="log-vitals-button" type="submit" className="submit-button" disabled={loading}>
                      {loading ? 'Logging...' : 'Log Vitals'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="vitals-history-card">
                <CardHeader>
                  <CardTitle>Recent Vitals</CardTitle>
                  <CardDescription>Your health tracking history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="vitals-list">
                    {vitals.length === 0 ? (
                      <p className="no-data">No vitals logged yet. Start tracking your health!</p>
                    ) : (
                      vitals.slice(0, 5).map((vital) => (
                        <div key={vital.id} className="vital-item">
                          <div className="vital-date">
                            {new Date(vital.timestamp).toLocaleDateString()}
                            <span>{new Date(vital.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="vital-data">
                            {vital.heart_rate && <span><Heart size={14} /> {vital.heart_rate} bpm</span>}
                            {vital.blood_pressure_systolic && <span><Droplet size={14} /> {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>}
                            {vital.temperature && <span><Thermometer size={14} /> {vital.temperature}°C</span>}
                            {vital.oxygen_saturation && <span><Activity size={14} /> {vital.oxygen_saturation}%</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="chat-card">
              <CardHeader>
                <CardTitle>AI Health Assistant</CardTitle>
                <CardDescription>Ask me about your recovery, medications, or symptoms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="chat-container">
                  <div className="chat-messages">
                    {chatHistory.length === 0 ? (
                      <div className="chat-empty">
                        <Brain size={48} className="chat-empty-icon" />
                        <p>Hi! I'm your CareCompanion AI assistant.</p>
                        <p>Ask me anything about your recovery journey!</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.type}`}>
                          <div className="message-content">{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleChatSubmit} className="chat-input-form">
                    <Input
                      data-testid="chat-input"
                      type="text"
                      placeholder="Type your question..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={loading}
                    />
                    <Button data-testid="send-message-button" type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const DoctorDashboard = ({ user, onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchFAQs();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/doctor/patients`, getAuthHeaders());
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await axios.get(`${API}/faqs`, getAuthHeaders());
      setFaqs(response.data);
    } catch (error) {
      toast.error('Failed to fetch FAQs');
    }
  };

  const fetchPatientVitals = async (patientId) => {
    try {
      const response = await axios.get(`${API}/doctor/patients/${patientId}/vitals`, getAuthHeaders());
      setPatientVitals(response.data);
    } catch (error) {
      toast.error('Failed to fetch patient vitals');
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientVitals(patient.id);
  };

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return '#10b981';
    switch (riskLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="https://customer-assets.emergentagent.com/job_medguardian/artifacts/em44cnqw_CC_logo.jpg" alt="CareCompanion" className="nav-logo" />
        </div>
        <div className="nav-user">
          <span className="user-name">Dr. {user.full_name}</span>
          <span className="user-role">{user.specialization || 'Doctor'}</span>
          <Button data-testid="logout-button" variant="ghost" size="sm" onClick={onLogout}>
            <LogOut size={18} />
          </Button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Doctor Dashboard</h1>
          <p>Monitor your patients and manage consultations</p>
        </div>

        <Tabs defaultValue="patients" className="dashboard-tabs">
          <TabsList>
            <TabsTrigger data-testid="patients-tab" value="patients">
              <Users size={18} />
              Patients ({patients.length})
            </TabsTrigger>
            <TabsTrigger data-testid="faqs-tab" value="faqs">
              <MessageCircle size={18} />
              FAQs ({faqs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <div className="doctor-grid">
              <Card className="patients-list-card">
                <CardHeader>
                  <CardTitle>Patient List</CardTitle>
                  <CardDescription>Click to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="patients-list">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        data-testid={`patient-card-${patient.id}`}
                        className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="patient-info">
                          <h4>{patient.full_name}</h4>
                          <p>{patient.email}</p>
                          {patient.age && <span className="patient-age">Age: {patient.age}</span>}
                        </div>
                        {patient.latest_risk && (
                          <div 
                            className="patient-risk-badge" 
                            style={{ backgroundColor: getRiskColor(patient.latest_risk.risk_level) }}
                          >
                            {patient.latest_risk.risk_level.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedPatient ? (
                <Card className="patient-details-card">
                  <CardHeader>
                    <CardTitle>{selectedPatient.full_name}'s Health Data</CardTitle>
                    <CardDescription>Recent vitals and risk assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedPatient.latest_risk && (
                      <div className="risk-summary" style={{ borderColor: getRiskColor(selectedPatient.latest_risk.risk_level) }}>
                        <div className="risk-header-small">
                          <AlertTriangle size={20} style={{ color: getRiskColor(selectedPatient.latest_risk.risk_level) }} />
                          <h4>Risk Level: {selectedPatient.latest_risk.risk_level.toUpperCase()}</h4>
                        </div>
                        <div className="risk-factors-small">
                          <strong>Factors:</strong>
                          <ul>
                            {selectedPatient.latest_risk.factors.map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    <div className="vitals-history">
                      <h4>Recent Vitals</h4>
                      <div className="vitals-timeline">
                        {patientVitals.slice(0, 7).map((vital) => (
                          <div key={vital.id} className="vital-timeline-item">
                            <div className="vital-date">
                              {new Date(vital.timestamp).toLocaleDateString()}
                            </div>
                            <div className="vital-values">
                              {vital.heart_rate && <span><Heart size={14} /> {vital.heart_rate}</span>}
                              {vital.blood_pressure_systolic && <span><Droplet size={14} /> {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>}
                              {vital.temperature && <span><Thermometer size={14} /> {vital.temperature}°C</span>}
                              {vital.oxygen_saturation && <span><Activity size={14} /> {vital.oxygen_saturation}%</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="patient-details-card">
                  <CardContent>
                    <div className="no-selection">
                      <Users size={64} />
                      <p>Select a patient to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="faqs">
            <Card className="faqs-card">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common patient inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="faqs-list">
                  {faqs.length === 0 ? (
                    <p className="no-data">No FAQs yet</p>
                  ) : (
                    faqs.map((faq) => (
                      <div key={faq.id} className="faq-item">
                        <div className="faq-header">
                          <div>
                            <h4>{faq.patient_name}</h4>
                            <span className="faq-category">{faq.category}</span>
                          </div>
                          <span className="faq-date">{new Date(faq.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="faq-question">{faq.question}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth2callback" element={<OAuthCallback onLogin={handleLogin} />} />
        <Route path="/" element={
          !user ? (
            <AuthPage onLogin={handleLogin} />
          ) : user.role === 'patient' ? (
            <PatientDashboard user={user} onLogout={handleLogout} />
          ) : (
            <DoctorDashboard user={user} onLogout={handleLogout} />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
