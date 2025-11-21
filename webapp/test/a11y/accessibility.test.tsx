/**
 * Automated accessibility tests using jest-axe.
 * Tests for WCAG 2.1 AA compliance including color contrast,
 * semantic HTML, ARIA attributes, and keyboard navigation.
 * 
 * Philosophy alignment:
 * - Transparency: Everyone can read and understand the UI
 * - Positivity: Inclusive design welcomes all users
 * - Mobile-First: Ensures touch and screen reader support
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Dashboard from '../../src/components/Dashboard';
import Breakdown from '../../src/components/Breakdown';
import Onboarding from '../../src/components/Onboarding';
import Header from '../../src/components/Header';
import WelcomeModal from '../../src/components/WelcomeModal';
import { createDefaultConfig } from '../../src/lib/types';

describe('Accessibility Tests', () => {
  const mockConfig = createDefaultConfig();
  const mockAllocation = {
    bills: [
      {
        name: 'Rent',
        required: 1000,
        allocated: 1000,
        remaining: 0,
        daysUntilDue: 5,
        isUrgent: true,
      },
    ],
    goals: [
      {
        name: 'Savings',
        type: 'percent' as const,
        value: 10,
        desired: 200,
        allocated: 200,
      },
    ],
    guilt_free: 800,
    meta: {
      paycheck: 2000,
      baseline_from_minimum: 2000,
      extra_allocated: 0,
      remaining_after_bills: 1000,
      supplemental_income: 0,
    },
  };

  describe('Dashboard Component', () => {
    it('should have no accessibility violations (light theme)', async () => {
      const { container } = render(
        <Dashboard config={mockConfig} theme="light" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (dark theme)', async () => {
      const { container } = render(
        <Dashboard config={mockConfig} theme="dark" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with results displayed', async () => {
      const { container } = render(
        <Dashboard
          config={mockConfig}
          theme="light"
          initialResult={mockAllocation}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Breakdown Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Breakdown
          allocation={mockAllocation}
          config={mockConfig}
          theme="light"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in dark theme', async () => {
      const { container } = render(
        <Breakdown
          allocation={mockAllocation}
          config={mockConfig}
          theme="dark"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Onboarding Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Onboarding
          initial={mockConfig}
          onSave={() => {}}
          lastSavedAt={Date.now()}
          theme="light"
          onExport={() => {}}
          onImport={() => {}}
          onClear={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Header Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Header
          lastAllocation={mockAllocation}
          theme="light"
          onToggleTheme={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations without allocation', async () => {
      const { container } = render(
        <Header
          lastAllocation={null}
          theme="light"
          onToggleTheme={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WelcomeModal Component', () => {
    it('should have no accessibility violations when open', async () => {
      const { container } = render(
        <WelcomeModal
          isOpen={true}
          onClose={() => {}}
          theme="light"
          onGoToSettings={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should pass contrast checks in light mode', async () => {
      const { container } = render(
        <Dashboard
          config={mockConfig}
          theme="light"
          initialResult={mockAllocation}
        />
      );
      
      // Axe will automatically check color contrast ratios
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should pass contrast checks in dark mode', async () => {
      const { container } = render(
        <Dashboard
          config={mockConfig}
          theme="dark"
          initialResult={mockAllocation}
        />
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { container } = render(
        <Dashboard config={mockConfig} theme="light" />
      );
      
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'button-name': { enabled: true },
          'label': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have meaningful labels for interactive elements', async () => {
      const { container } = render(
        <Dashboard
          config={mockConfig}
          theme="light"
          initialResult={mockAllocation}
        />
      );
      
      const results = await axe(container, {
        rules: {
          'label-title-only': { enabled: true },
          'link-name': { enabled: true },
          'aria-input-field-name': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});
