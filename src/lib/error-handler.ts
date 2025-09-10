// Comprehensive error handling system for Zipplign
import { toast } from '@/hooks/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  path?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  handleError(error: any, context?: string): void {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: error,
      timestamp: new Date(),
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    // Log error
    this.logError(appError);

    // Show user-friendly message
    this.showUserMessage(appError, context);

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(appError);
    }
  }

  private getErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.name) return error.name;
    if (error?.status) return `HTTP_${error.status}`;
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    console.error('App Error:', error);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  private showUserMessage(error: AppError, context?: string): void {
    let title = 'Error';
    let description = error.message;

    // Customize messages based on error type
    switch (error.code) {
      case 'PGRST116':
        title = 'Not Found';
        description = 'The requested content could not be found.';
        break;
      case 'PGRST301':
        title = 'Authentication Required';
        description = 'Please log in to continue.';
        break;
      case 'PGRST403':
        title = 'Access Denied';
        description = 'You do not have permission to perform this action.';
        break;
      case 'NETWORK_ERROR':
        title = 'Connection Error';
        description = 'Please check your internet connection and try again.';
        break;
      case 'UPLOAD_ERROR':
        title = 'Upload Failed';
        description = 'Failed to upload your content. Please try again.';
        break;
      case 'AUTH_ERROR':
        title = 'Authentication Error';
        description = 'Please log in again to continue.';
        break;
      default:
        if (context) {
          title = `${context} Error`;
        }
    }

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  private sendToMonitoring(error: AppError): void {
    // In production, send to monitoring service like Sentry
    // For now, just log to console
    console.error('Production Error:', error);
  }

  // Get error history
  getErrorHistory(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  // Handle specific error types
  handleNetworkError(error: any): void {
    this.handleError({
      ...error,
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
    });
  }

  handleAuthError(error: any): void {
    this.handleError({
      ...error,
      code: 'AUTH_ERROR',
      message: 'Authentication failed. Please log in again.',
    });
  }

  handleUploadError(error: any): void {
    this.handleError({
      ...error,
      code: 'UPLOAD_ERROR',
      message: 'Upload failed. Please try again.',
    });
  }

  handleDatabaseError(error: any): void {
    this.handleError({
      ...error,
      code: 'DATABASE_ERROR',
      message: 'Database operation failed. Please try again.',
    });
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleSupabaseError = (error: any, operation: string) => {
  if (error?.code === 'PGRST116') {
    errorHandler.handleError({
      code: 'NOT_FOUND',
      message: `${operation} not found`,
      details: error,
    });
  } else if (error?.code === 'PGRST301') {
    errorHandler.handleError({
      code: 'AUTH_ERROR',
      message: 'Please log in to continue',
      details: error,
    });
  } else {
    errorHandler.handleError({
      code: 'DATABASE_ERROR',
      message: `Failed to ${operation.toLowerCase()}`,
      details: error,
    });
  }
};

export const handleNetworkError = (error: any) => {
  errorHandler.handleNetworkError(error);
};

export const handleAuthError = (error: any) => {
  errorHandler.handleAuthError(error);
};

export const handleUploadError = (error: any) => {
  errorHandler.handleUploadError(error);
};
