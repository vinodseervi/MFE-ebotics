import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';
import USDateInput from '../components/USDateInput';
import { filterEmojis } from '../utils/emojiFilter';
import './CreateCheck.css';

const CreateCheck = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [practices, setPractices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    checkNumber: '',
    altCheckNumber: '',
    depositDate: '',
    practiceCode: '',
    locationCode: '',
    bankTrnRef: '',
    batchDescription: '',
    exchange: '',
    payer: '',
    totalAmount: '',
    checkType: 'EFT',
    legacyNotes: '',
    againstCheckAdditional: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPractices();
  }, []);

  useEffect(() => {
    if (formData.practiceCode && practices.length > 0) {
      fetchLocations(formData.practiceCode);
    } else {
      setLocations([]);
      setFormData(prev => ({ ...prev, locationCode: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.practiceCode, practices]);

  const fetchPractices = async () => {
    try {
      const response = await api.getAllPractices();
      const practicesList = Array.isArray(response) ? response : (response?.items || []);
      setPractices(practicesList.filter(p => p.isActive !== false));
    } catch (error) {
      console.error('Error fetching practices:', error);
    }
  };

  const fetchLocations = async (practiceCode) => {
    try {
      const practice = practices.find(p => p.code === practiceCode);
      if (practice && (practice.practiceId || practice.id)) {
        const practiceId = practice.practiceId || practice.id;
        const response = await api.getPracticeLocations(practiceId);
        const locationsList = Array.isArray(response) ? response : (response?.items || []);
        setLocations(locationsList.filter(l => l.isActive !== false));
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Filter emojis from string inputs
    const filteredValue = filterEmojis(value);
    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.checkNumber.trim()) {
      errors.checkNumber = 'Check number is required';
    }
    
    if (!formData.depositDate.trim()) {
      errors.depositDate = 'Deposit date is required';
    }
    
    if (!formData.practiceCode) {
      errors.practiceCode = 'Practice is required';
    }
    
    if (!formData.payer.trim()) {
      errors.payer = 'Payer is required';
    }
    
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      errors.totalAmount = 'Total amount is required and must be greater than 0';
    }
    
    if (!formData.checkType) {
      errors.checkType = 'Check type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const checkData = {
        checkNumber: formData.checkNumber.trim(),
        altCheckNumber: formData.altCheckNumber.trim() || null,
        depositDate: formData.depositDate,
        practiceCode: formData.practiceCode,
        locationCode: formData.locationCode || null,
        bankTrnRef: formData.bankTrnRef.trim() || null,
        batchDescription: formData.batchDescription.trim() || null,
        exchange: formData.exchange.trim() || null,
        payer: formData.payer.trim(),
        totalAmount: parseFloat(formData.totalAmount),
        checkType: formData.checkType,
        legacyNotes: formData.legacyNotes.trim() || null,
        againstCheckAdditional: formData.againstCheckAdditional.trim() || null
      };

      await api.createCheck(checkData);
      
      // Navigate to checks list or check details
      navigate('/checks');
    } catch (err) {
      console.error('Error creating check:', err);
      const errorMessage = err.message || err.error || 'Failed to create check. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/checks');
  };

  // Get today's date in YYYY-MM-DD format for default
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="create-check-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Create Check</h1>
          <p className="page-subtitle">Add a new payment check to the system</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-check-form">
        <div className="form-section">
          <h2 className="section-title">Check Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="checkNumber">
                Check Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="checkNumber"
                name="checkNumber"
                value={formData.checkNumber}
                onChange={handleInputChange}
                placeholder="e.g., CHK-2025-0001"
                className={formErrors.checkNumber ? 'error' : ''}
                required
              />
              {formErrors.checkNumber && (
                <span className="error-text">{formErrors.checkNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="altCheckNumber">Alternate Check Number</label>
              <input
                type="text"
                id="altCheckNumber"
                name="altCheckNumber"
                value={formData.altCheckNumber}
                onChange={handleInputChange}
                placeholder="e.g., ALT-0001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="depositDate">
                Deposit Date <span className="required">*</span>
              </label>
              <USDateInput
                id="depositDate"
                name="depositDate"
                value={formData.depositDate}
                onChange={handleInputChange}
                max={getTodayDate()}
                className={formErrors.depositDate ? 'error' : ''}
                required
              />
              {formErrors.depositDate && (
                <span className="error-text">{formErrors.depositDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="checkType">
                Check Type <span className="required">*</span>
              </label>
              <SearchableDropdown
                options={[
                  { value: 'EFT', label: 'EFT' },
                  { value: 'ERA', label: 'ERA' },
                  { value: 'DIT/DRL', label: 'DIT/DRL' },
                  { value: 'NON_AR', label: 'NON_AR' },
                  { value: 'REFUND', label: 'REFUND' },
                  { value: 'LOCK_BOX', label: 'LOCK_BOX' },
                  { value: 'DEBIT', label: 'DEBIT' },
                  { value: 'FEE', label: 'FEE' }
                ]}
                value={formData.checkType}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, checkType: value }));
                  if (formErrors.checkType) {
                    setFormErrors(prev => ({ ...prev, checkType: '' }));
                  }
                }}
                placeholder="Select Check Type"
                maxVisibleItems={5}
              />
              {formErrors.checkType && (
                <span className="error-text">{formErrors.checkType}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Practice & Location</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="practiceCode">
                Practice <span className="required">*</span>
              </label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'Select Practice' },
                  ...practices.map(practice => ({
                    value: practice.code,
                    label: `${practice.name} (${practice.code})`
                  }))
                ]}
                value={formData.practiceCode}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, practiceCode: value }));
                  if (formErrors.practiceCode) {
                    setFormErrors(prev => ({ ...prev, practiceCode: '' }));
                  }
                }}
                placeholder="Select Practice"
                maxVisibleItems={5}
              />
              {formErrors.practiceCode && (
                <span className="error-text">{formErrors.practiceCode}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="locationCode">Location</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'Select Location' },
                  ...locations.map(location => ({
                    value: location.code,
                    label: `${location.name} (${location.code})`
                  }))
                ]}
                value={formData.locationCode}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, locationCode: value }));
                }}
                placeholder="Select Location"
                disabled={!formData.practiceCode || locations.length === 0}
                maxVisibleItems={5}
              />
              {!formData.practiceCode && (
                <span className="field-hint">Select a practice first</span>
              )}
              {formData.practiceCode && locations.length === 0 && (
                <span className="field-hint">No locations available for this practice</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Payment Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="payer">
                Payer <span className="required">*</span>
              </label>
              <input
                type="text"
                id="payer"
                name="payer"
                value={formData.payer}
                onChange={handleInputChange}
                placeholder="e.g., Blue Cross"
                className={formErrors.payer ? 'error' : ''}
                required
              />
              {formErrors.payer && (
                <span className="error-text">{formErrors.payer}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="totalAmount">
                Total Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={formErrors.totalAmount ? 'error' : ''}
                required
              />
              {formErrors.totalAmount && (
                <span className="error-text">{formErrors.totalAmount}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bankTrnRef">Bank TRN Reference</label>
              <input
                type="text"
                id="bankTrnRef"
                name="bankTrnRef"
                value={formData.bankTrnRef}
                onChange={handleInputChange}
                placeholder="e.g., TRN-12345"
              />
            </div>

            <div className="form-group">
              <label htmlFor="batchDescription">Batch Description</label>
              <input
                type="text"
                id="batchDescription"
                name="batchDescription"
                value={formData.batchDescription}
                onChange={handleInputChange}
                placeholder="e.g., Lockbox December"
              />
            </div>

            <div className="form-group">
              <label htmlFor="exchange">Exchange</label>
              <input
                type="text"
                id="exchange"
                name="exchange"
                value={formData.exchange}
                onChange={handleInputChange}
                placeholder="e.g., Manual upload"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Additional Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="legacyNotes">Legacy Notes</label>
              <textarea
                id="legacyNotes"
                name="legacyNotes"
                value={formData.legacyNotes}
                onChange={handleInputChange}
                placeholder="e.g., Imported from legacy"
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="againstCheckAdditional">Against Check Additional</label>
              <textarea
                id="againstCheckAdditional"
                name="againstCheckAdditional"
                value={formData.againstCheckAdditional}
                onChange={handleInputChange}
                placeholder="e.g., Reference to EFT 123"
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Check'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCheck;

