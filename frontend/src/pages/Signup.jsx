import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';

// Simple 6-digit OTP simulator — real OTP is sent by backend via email
// The frontend just shows the verification step; backend handles sending/checking

const Signup = ({ setUser }) => {
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── Step 1: Submit form → backend sends OTP email ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      // Ask backend to send OTP — uses /auth/send-otp endpoint
      await authApi.sendOtp(email, name);
      setInfo(`We sent a 6-digit code to ${email}. Check your inbox (and spam folder).`);
      setStep('verify');
    } catch (err) {
      // If backend doesn't have OTP yet, fall back to direct signup
      if (err.response?.status === 404) {
        try {
          const response = await authApi.signup(name, email, password);
          if (response.data.user) { setUser(response.data.user); navigate('/'); }
          else setError(response.data.error || 'Signup failed');
        } catch (err2) {
          setError(err2.response?.data?.error || 'Signup failed. Try again.');
        }
      } else {
        setError(err.response?.data?.error || 'Could not send verification email. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Submit OTP → backend verifies & creates account ──
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the full 6-digit code'); return; }

    setLoading(true);
    try {
      const response = await authApi.verifyOtpSignup({ name, email, password, otp: code });
      if (response.data.user) { setUser(response.data.user); navigate('/'); }
      else setError(response.data.error || 'Verification failed');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input — auto-focus next box
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const resendOtp = async () => {
    setError(''); setInfo('');
    setLoading(true);
    try {
      await authApi.sendOtp(email, name);
      setInfo('A new code has been sent to your email.');
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {step === 'form' ? (
          <>
            <h3 className="auth-title">Create Account</h3>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" className="form-input" id="name" value={name}
                  onChange={e => setName(e.target.value)} required placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" className="form-input" id="email" value={email}
                  onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" className="form-input" id="password" value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" className="form-input" id="confirmPassword" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat your password" />
              </div>

              {/* Password strength indicator */}
              {password && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= (password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1)
                          ? (password.length >= 10 ? '#00c853' : password.length >= 6 ? '#ff9800' : '#e50914')
                          : '#333'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : password.length >= 6 ? 'Weak' : 'Too short'}
                  </span>
                </div>
              )}

              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Log in</Link></p>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(229,9,20,0.1)', border: '2px solid #e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.4rem' }}>
                <i className="fas fa-envelope-open-text" style={{ color: '#e50914' }}></i>
              </div>
              <h3 className="auth-title" style={{ marginBottom: '8px' }}>Verify Your Email</h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>{info || `Enter the 6-digit code sent to ${email}`}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleVerify}>
              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    style={{
                      width: '48px', height: '56px', textAlign: 'center',
                      fontSize: '1.4rem', fontWeight: '700',
                      background: '#1a1a1a', border: `2px solid ${digit ? '#e50914' : '#333'}`,
                      borderRadius: '8px', color: 'white', outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                ))}
              </div>

              <button type="submit" className="btn-auth" disabled={loading || otp.join('').length < 6}>
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Didn't get it? </span>
              <button onClick={resendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                Resend code
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={() => { setStep('form'); setOtp(['','','','','','']); setError(''); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}>
                ← Change email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;