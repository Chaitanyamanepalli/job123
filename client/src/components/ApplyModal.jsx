import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';

const ApplyModal = ({ isOpen, onClose, job, onApplySuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Prefill email if cached in LocalStorage
  useEffect(() => {
    if (isOpen) {
      const cachedEmail = localStorage.getItem('candidateEmail') || '';
      setFormData({
        name: '',
        email: cachedEmail,
        phone: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (7 to 15 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await api.applyJob(job._id, formData);
      
      // Store email in local storage for later tracking
      localStorage.setItem('candidateEmail', formData.email.trim().toLowerCase());
      
      onApplySuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to submit application.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply for: ${job?.title}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div style={{ color: 'var(--error)', padding: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
            {errors.submit}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="applicant-name">Full Name</label>
          <input
            id="applicant-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. John Doe"
            disabled={loading}
          />
          {errors.name && <span className="form-error-msg">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="applicant-email">Email Address</label>
          <input
            id="applicant-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. johndoe@gmail.com"
            disabled={loading}
          />
          {errors.email && <span className="form-error-msg">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="applicant-phone">Phone Number</label>
          <input
            id="applicant-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. +1 555-0199"
            disabled={loading}
          />
          {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
        </div>
      </form>
    </Modal>
  );
};

export default ApplyModal;
