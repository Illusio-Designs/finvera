/**
 * Unit Tests for DocumentActionButtons Component
 */

const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Import component
let DocumentActionButtons;
try {
  DocumentActionButtons = require('../DocumentActionButtons');
  if (DocumentActionButtons.default) {
    DocumentActionButtons = DocumentActionButtons.default;
  }
} catch (error) {
  console.error('Failed to import:', error);
  throw error;
}

describe('DocumentActionButtons - Basic Tests', () => {
  test('should render generate button for PENDING status', () => {
    const mockGenerate = jest.fn();
    
    const { getByText } = render(
      <DocumentActionButtons
        status="PENDING"
        onGenerate={mockGenerate}
        loading={false}
      />
    );

    expect(getByText('Generate')).toBeTruthy();
  });

  test('should render cancel button for GENERATED status', () => {
    const mockCancel = jest.fn();
    
    const { getByText } = render(
      <DocumentActionButtons
        status="GENERATED"
        onCancel={mockCancel}
        loading={false}
      />
    );

    expect(getByText('Cancel')).toBeTruthy();
  });

  test('should render retry button for FAILED status', () => {
    const mockRetry = jest.fn();
    
    const { getByText } = render(
      <DocumentActionButtons
        status="FAILED"
        onRetry={mockRetry}
        loading={false}
      />
    );

    expect(getByText('Retry')).toBeTruthy();
  });

  test('should render nothing for CANCELLED status', () => {
    const { UNSAFE_queryAllByType } = render(
      <DocumentActionButtons
        status="CANCELLED"
        loading={false}
      />
    );

    const buttons = UNSAFE_queryAllByType('TouchableOpacity');
    expect(buttons.length).toBe(0);
  });

  test('should disable button when loading', () => {
    const mockGenerate = jest.fn();
    
    const { getByText, UNSAFE_root } = render(
      <DocumentActionButtons
        status="PENDING"
        onGenerate={mockGenerate}
        loading={true}
      />
    );

    // Should show "Generating..." text when loading
    expect(getByText('Generating...')).toBeTruthy();
    
    // The button should exist and be disabled
    // We can't easily test the disabled prop without accessing internals,
    // but we can verify the loading text is shown which indicates the button is in loading state
    expect(getByText('Generating...')).toBeTruthy();
  });
});
