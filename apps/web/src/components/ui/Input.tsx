/**
 * 공통 입력 필드 컴포넌트
 */

import React, { forwardRef } from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      placeholder,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled = false,
      required = false,
      error,
      helperText,
      maxLength,
      className = '',
      inputClassName = '',
    },
    ref
  ) => {
    const inputBaseClass = `
    w-full p-3 border rounded-xl 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    outline-none text-gray-900 
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
  `;

    const inputVariantClass = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 hover:border-gray-400';

    const inputClasses = `${inputBaseClass} ${inputVariantClass} ${inputClassName}`
      .trim()
      .replace(/\s+/g, ' ');

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={inputClasses}
        />

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
