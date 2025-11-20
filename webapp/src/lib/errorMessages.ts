/**
 * Positive error messages for user-facing errors.
 * Each message includes an icon, helpful description, and optional action.
 */

export type ErrorMessage = {
  icon: string;
  title: string;
  message: string;
  action?: string;
};

export const ERROR_MESSAGES = {
  // Storage errors
  SAVE_FAILED: {
    icon: '💾',
    title: "Couldn't Save",
    message:
      'Something went wrong, but your changes are safe for now. Try saving again in a moment!',
    action: 'Retry',
  },
  STORAGE_QUOTA: {
    icon: '📦',
    title: 'Storage Full',
    message: "Your browser's storage is full. Export your config and clear some space to continue!",
    action: 'Export Now',
  },
  LOAD_FAILED: {
    icon: '📂',
    title: 'Load Issue',
    message:
      "Couldn't load your saved settings. Don't worry—we'll start fresh and you can import a backup!",
    action: 'Import Backup',
  },

  // Input validation errors
  INVALID_AMOUNT: {
    icon: '💡',
    title: 'Check Your Amount',
    message: 'Enter a number greater than zero to see your guilt-free spending!',
  },
  INVALID_BILL_NAME: {
    icon: '✏️',
    title: 'Name Your Bill',
    message: 'Give your bill a name so you can track it easily!',
  },
  INVALID_GOAL_NAME: {
    icon: '🎯',
    title: 'Name Your Goal',
    message: 'Give your goal a name to stay motivated!',
  },
  INVALID_NUMBER: {
    icon: '🔢',
    title: 'Numbers Only',
    message: 'Please enter a valid positive number for this field.',
  },
  INVALID_RANGE: {
    icon: '📊',
    title: 'Check Your Range',
    message: 'Make sure the maximum amount is greater than or equal to the minimum!',
  },

  // Calculation errors
  CALCULATION_FAILED: {
    icon: '🧮',
    title: 'Calculation Hiccup',
    message: 'We hit a snag calculating your allocation. Double-check your inputs and try again!',
    action: 'Review Settings',
  },

  // Import/export errors
  IMPORT_FAILED: {
    icon: '📥',
    title: 'Import Failed',
    message: "Couldn't read that file. Make sure it's a valid PayFlow config file and try again!",
    action: 'Try Again',
  },
  EXPORT_FAILED: {
    icon: '📤',
    title: 'Export Failed',
    message: "Couldn't export your config right now. Try again in a moment!",
    action: 'Retry',
  },
  INVALID_CONFIG: {
    icon: '⚠️',
    title: 'Invalid Configuration',
    message:
      'That config file looks corrupted or is in the wrong format. Try exporting a fresh copy!',
  },

  // General errors
  UNKNOWN_ERROR: {
    icon: '🤔',
    title: 'Something Went Wrong',
    message:
      "We're not sure what happened, but don't worry—your data is safe. Try refreshing the page!",
    action: 'Refresh',
  },
} as const;

export type ErrorType = keyof typeof ERROR_MESSAGES;

/**
 * Get a friendly error message for display to users.
 * @param errorType - The type of error that occurred
 * @returns ErrorMessage object with icon, title, message, and optional action
 */
export function getErrorMessage(errorType: ErrorType): ErrorMessage {
  return ERROR_MESSAGES[errorType];
}

/**
 * Detect specific error types from JavaScript Error objects.
 * @param error - The error object to analyze
 * @returns The appropriate ErrorType, or UNKNOWN_ERROR if unrecognized
 */
export function detectErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    // Detect quota exceeded errors
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      return 'STORAGE_QUOTA';
    }
    // Detect JSON parsing errors
    if (error instanceof SyntaxError || error.message.includes('JSON')) {
      return 'INVALID_CONFIG';
    }
  }
  return 'UNKNOWN_ERROR';
}
