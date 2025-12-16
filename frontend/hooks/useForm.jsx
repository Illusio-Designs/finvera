import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling
 */
export const useForm = (initialValues = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [errors]);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const setError = useCallback((name, message) => {
    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }));
  }, []);

  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e) => {
    if (e) {
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
  }, [values, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setError,
    setFieldValue,
    setValues,
    reset,
  };
};

