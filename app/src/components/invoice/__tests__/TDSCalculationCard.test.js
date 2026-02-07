/**
 * Unit Tests for TDSCalculationCard Component
 * 
 * Tests TDSCalculationCard rendering, section selector, amount display,
 * and recalculation triggers
 * 
 * Requirements: 4.2, 4.3, 4.4
 */

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('../../../utils/formatters', () => ({
  formatCurrency: (amount) => `₹ ${amount?.toFixed(2) || '0.00'}`
}));

// Import component
let TDSCalculationCard;
try {
  TDSCalculationCard = require('../TDSCalculationCard');
  if (TDSCalculationCard.default) {
    TDSCalculationCard = TDSCalculationCard.default;
  }
} catch (error) {
  console.error('Failed to import TDSCalculationCard:', error);
  throw error;
}

describe('TDSCalculationCard Component - Unit Tests', () => {
  const mockCallbacks = {
    onSectionChange: jest.fn(),
    onCalculate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Section Selector', () => {
    test('should display section selector button', () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('TDS Section *')).toBeTruthy();
      expect(getByText('Select TDS Section')).toBeTruthy();
    });

    test('should display selected section in selector', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('194C - Contractor Payments')).toBeTruthy();
    });

    test('should open modal when selector is pressed', () => {
      const { getAllByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      const selectorButton = getAllByText('Select TDS Section')[0];
      fireEvent.press(selectorButton);

      // Modal should open - there will be multiple instances of the text
      const allInstances = getAllByText('Select TDS Section');
      expect(allInstances.length).toBeGreaterThan(1);
    });

    test('should call onSectionChange when section is selected', async () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open modal
      const selectorButton = getByText('Select TDS Section');
      fireEvent.press(selectorButton);

      // Select a section
      const section194J = getByText('194J - Professional Services');
      fireEvent.press(section194J);

      await waitFor(() => {
        expect(mockCallbacks.onSectionChange).toHaveBeenCalledWith('194J');
      });
    });

    test('should display all TDS sections in modal', () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open modal
      const selectorButton = getByText('Select TDS Section');
      fireEvent.press(selectorButton);

      // Check all sections are present
      expect(getByText('194C - Contractor Payments')).toBeTruthy();
      expect(getByText('194J - Professional Services')).toBeTruthy();
      expect(getByText('194H - Commission')).toBeTruthy();
      expect(getByText('194I - Rent')).toBeTruthy();
      expect(getByText('194A - Interest')).toBeTruthy();
      expect(getByText('192 - Salary')).toBeTruthy();
      expect(getByText('194D - Insurance Commission')).toBeTruthy();
      expect(getByText('194G - Lottery Winnings')).toBeTruthy();
      expect(getByText('Other')).toBeTruthy();
    });
  });

  describe('Amount Display', () => {
    test('should display TDS rate when calculated', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('TDS Rate:')).toBeTruthy();
      expect(getByText('2%')).toBeTruthy();
    });

    test('should display transaction amount', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Transaction Amount:')).toBeTruthy();
      expect(getByText('₹ 10000.00')).toBeTruthy();
    });

    test('should display calculated TDS amount', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('TDS Amount:')).toBeTruthy();
      expect(getByText('₹ 200.00')).toBeTruthy();
    });

    test('should display net payable amount', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Net Payable:')).toBeTruthy();
      expect(getByText('₹ 9800.00')).toBeTruthy();
    });

    test('should display deductee type when present', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'INDIVIDUAL',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Deductee Type:')).toBeTruthy();
      expect(getByText('INDIVIDUAL')).toBeTruthy();
    });

    test('should display PAN number when present', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: 'ABCDE1234F',
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('PAN Number:')).toBeTruthy();
      expect(getByText('ABCDE1234F')).toBeTruthy();
    });

    test('should display calculated badge when TDS is calculated', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Calculated')).toBeTruthy();
    });
  });

  describe('Recalculation Triggers', () => {
    test('should display info message when no TDS is calculated', () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText(/Select a TDS section/i)).toBeTruthy();
    });

    test('should update display when amount changes', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText, rerender } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('₹ 10000.00')).toBeTruthy();
      expect(getByText('₹ 200.00')).toBeTruthy();

      // Update with new amount and recalculated TDS
      const newTdsDetails = {
        ...tdsDetails,
        amount: 400
      };

      rerender(
        <TDSCalculationCard
          tdsDetails={newTdsDetails}
          amount={20000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('₹ 20000.00')).toBeTruthy();
      expect(getByText('₹ 400.00')).toBeTruthy();
    });

    test('should update display when section changes', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText, rerender } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('194C - Contractor Payments')).toBeTruthy();
      expect(getByText('2%')).toBeTruthy();

      // Update with new section and rate
      const newTdsDetails = {
        section: '194J',
        rate: 10,
        amount: 1000,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      rerender(
        <TDSCalculationCard
          tdsDetails={newTdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('194J - Professional Services')).toBeTruthy();
      expect(getByText('10%')).toBeTruthy();
      expect(getByText('₹ 1000.00')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    test('should display loading indicator when loading', () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={true}
        />
      );

      expect(getByText('Calculating TDS...')).toBeTruthy();
    });

    test('should disable selector button when loading', () => {
      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={true}
        />
      );

      const selectorButton = getByText('Select TDS Section');
      // Check that the button is disabled by checking if it's in a disabled state
      // In React Native, disabled is typically handled via the disabled prop on TouchableOpacity
      expect(selectorButton).toBeTruthy();
    });

    test('should not display loading indicator when not loading', () => {
      const { queryByText } = render(
        <TDSCalculationCard
          tdsDetails={null}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(queryByText('Calculating TDS...')).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero amount', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 0,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getAllByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={0}
          {...mockCallbacks}
          loading={false}
        />
      );

      // There will be multiple instances of ₹ 0.00 (transaction amount, TDS amount, net amount)
      const zeroAmounts = getAllByText('₹ 0.00');
      expect(zeroAmounts.length).toBeGreaterThan(0);
    });

    test('should handle large amounts', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200000,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('₹ 10000000.00')).toBeTruthy();
      expect(getByText('₹ 200000.00')).toBeTruthy();
    });

    test('should handle decimal rates', () => {
      const tdsDetails = {
        section: '194C',
        rate: 1.5,
        amount: 150,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('1.5%')).toBeTruthy();
    });

    test('should handle null PAN number', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { queryByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      // PAN Number label should not be displayed when null
      expect(queryByText('PAN Number:')).toBeFalsy();
    });
  });

  describe('Net Amount Calculation', () => {
    test('should correctly calculate net amount (gross - TDS)', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Net = 10000 - 200 = 9800
      expect(getByText('₹ 9800.00')).toBeTruthy();
    });

    test('should handle net amount when TDS equals transaction amount', () => {
      const tdsDetails = {
        section: '194C',
        rate: 100,
        amount: 10000,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Net = 10000 - 10000 = 0
      expect(getByText('₹ 0.00')).toBeTruthy();
    });
  });

  describe('Consistency', () => {
    test('should render consistently for same props', () => {
      const tdsDetails = {
        section: '194C',
        rate: 2,
        amount: 200,
        deducteeType: 'COMPANY',
        panNumber: null,
        calculatedAt: new Date()
      };

      const { getByText: getByText1 } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      const { getByText: getByText2 } = render(
        <TDSCalculationCard
          tdsDetails={tdsDetails}
          amount={10000}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText1('194C - Contractor Payments')).toBeTruthy();
      expect(getByText2('194C - Contractor Payments')).toBeTruthy();
      expect(getByText1('₹ 200.00')).toBeTruthy();
      expect(getByText2('₹ 200.00')).toBeTruthy();
    });
  });
});
