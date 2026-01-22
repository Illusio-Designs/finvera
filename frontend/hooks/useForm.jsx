import { useState, useCallback } from 'react';
import { validateForm, validateField } from '../lib/validators';
import { useApiWithErrorHandling } from './useApiWithErrorHandling';

/**
 * Enhanced custom hook for form handling with validation and API integration
 */
export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { callApi, loading, error: apiError, clearError } = useApiWithErrorHandling();

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Real-time validation if field has been touched
    if (touched[name] && validationRules[name]) {
      const fieldValidation = validateField(value, validationRules[name]);
      if (!fieldValidation.valid) {
        setErrors(prev => ({ ...prev, [name]: fieldValidation.message }));
      }
    }
  }, [errors, touched, validationRules]);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate field on blur
    if (validationRules[name]) {
      const fieldValidation = validateField(values[name], validationRules[name]);
      if (!fieldValidation.valid) {
        setErrors(prev => ({ ...prev, [name]: fieldValidation.message }));
      }
    }
  }, [values, validationRules]);

  const setError = useCallback((name, message) => {
    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }));
  }, []);

  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  // Validate entire form
  const validate = useCallback(() => {
    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  }, [values, validationRules]);

  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    clearError();
  }, [initialValues, clearError]);

  // Enhanced submit with API integration
  const handleSubmit = useCallback(async (apiCall, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      transform = (data) => data,
      validateBeforeSubmit = true,
      preventDefault = true 
    } = options;

    // Handle event if passed
    if (typeof apiCall === 'object' && apiCall.preventDefault) {
      if (preventDefault) apiCall.preventDefault();
      // If first argument is event, second should be the actual API call
      apiCall = arguments[1];
      options = arguments[2] || {};
    }

    // Validate form if required
    if (validateBeforeSubmit && !validate()) {
      return { success: false, errors };
    }

    setIsSubmitting(true);
    clearError();
    
    // Mark all fields as touched
    setTouched(
      Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    try {
      const transformedData = transform(values);
      const result = await callApi(() => apiCall(transformedData), 'Form submission');
      
      if (onSuccess) {
        onSuccess(result, values);
      }
      
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (error) {
      setIsSubmitting(false);
      
      // Handle validation errors from API
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: error.message || 'An error occurred' });
      }
      
      if (onError) {
        onError(error, values);
      }
      
      return { success: false, error };
    }
  }, [values, errors, validate, callApi, clearError]);

  // Legacy submit handler for backward compatibility
  const handleLegacySubmit = useCallback(async (e, onSubmit) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    setTouched(
      Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    try {
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ submit: error.message || 'An error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values]);

  // Get field props for form components
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    error: errors[name],
    onChange: handleChange,
    onBlur: () => handleBlur(name),
  }), [values, errors, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    loading: loading || isSubmitting,
    apiError,
    handleChange,
    handleBlur,
    handleSubmit,
    handleLegacySubmit, // For backward compatibility
    setError,
    setFieldValue,
    setValues,
    validate,
    reset,
    getFieldProps,
    clearError,
  };
};

