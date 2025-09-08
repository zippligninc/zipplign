// Server Recovery and Error Handling System
import { errorHandler } from './error-handler';

interface ServerError {
  code: string;
  message: string;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
}

class ServerRecovery {
  private static instance: ServerRecovery;
  private errorHistory: ServerError[] = [];
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 5;

  static getInstance(): ServerRecovery {
    if (!ServerRecovery.instance) {
      ServerRecovery.instance = new ServerRecovery();
    }
    return ServerRecovery.instance;
  }

  // Handle server errors with automatic recovery
  async handleServerError(error: any, context?: string): Promise<boolean> {
    const serverError: ServerError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      timestamp: new Date(),
      context,
      recoverable: this.isRecoverable(error)
    };

    this.errorHistory.push(serverError);
    this.logError(serverError);

    if (serverError.recoverable && this.recoveryAttempts < this.maxRecoveryAttempts) {
      return await this.attemptRecovery(serverError);
    }

    return false;
  }

  private getErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.name) return error.name;
    if (error?.status) return `HTTP_${error.status}`;
    return 'UNKNOWN_SERVER_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown server error occurred';
  }

  private isRecoverable(error: any): boolean {
    const recoverableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EADDRINUSE',
      'PGRST116',
      'PGRST301',
      'NETWORK_ERROR',
      'DATABASE_CONNECTION_ERROR'
    ];

    return recoverableErrors.some(code => 
      error?.code === code || 
      error?.message?.includes(code) ||
      error?.name === code
    );
  }

  private logError(error: ServerError): void {
    console.error('Server Error:', {
      code: error.code,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      recoverable: error.recoverable
    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Integrate with monitoring service
      console.error('Production Server Error:', error);
    }
  }

  private async attemptRecovery(error: ServerError): Promise<boolean> {
    this.recoveryAttempts++;
    console.log(`🔄 Attempting recovery (${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

    try {
      switch (error.code) {
        case 'EADDRINUSE':
          return await this.recoverPortConflict();
        case 'ECONNRESET':
        case 'ETIMEDOUT':
          return await this.recoverNetworkError();
        case 'PGRST116':
        case 'PGRST301':
          return await this.recoverDatabaseError();
        default:
          return await this.recoverGenericError();
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  private async recoverPortConflict(): Promise<boolean> {
    console.log('🔧 Recovering from port conflict...');
    
    // In a real implementation, you would:
    // 1. Find and kill the process using the port
    // 2. Wait for the port to be released
    // 3. Restart the server
    
    // For now, just wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  private async recoverNetworkError(): Promise<boolean> {
    console.log('🔧 Recovering from network error...');
    
    // Wait and retry network operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private async recoverDatabaseError(): Promise<boolean> {
    console.log('🔧 Recovering from database error...');
    
    // Wait and retry database operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private async recoverGenericError(): Promise<boolean> {
    console.log('🔧 Attempting generic recovery...');
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  // Reset recovery attempts (call after successful operation)
  resetRecoveryAttempts(): void {
    this.recoveryAttempts = 0;
  }

  // Get error history
  getErrorHistory(): ServerError[] {
    return [...this.errorHistory];
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.recoveryAttempts = 0;
  }

  // Check if server is in a bad state
  isServerUnhealthy(): boolean {
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    return recentErrors.length > 10; // More than 10 errors in 5 minutes
  }
}

// Global server recovery instance
export const serverRecovery = ServerRecovery.getInstance();

// Utility functions for common server error scenarios
export const handleServerError = async (error: any, context?: string): Promise<boolean> => {
  return await serverRecovery.handleServerError(error, context);
};

export const isServerHealthy = (): boolean => {
  return !serverRecovery.isServerUnhealthy();
};

export const resetServerRecovery = (): void => {
  serverRecovery.resetRecoveryAttempts();
};
