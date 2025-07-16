import { AsyncLocalStorage } from 'async_hooks';

interface CorrelationContext {
  correlationId: string;
}

export class CorrelationIdUtil {
  private static asyncLocalStorage =
    new AsyncLocalStorage<CorrelationContext>();

  static setCorrelationId(correlationId: string): void {
    const context = { correlationId };
    this.asyncLocalStorage.enterWith(context);
  }

  static getCorrelationId(): string | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.correlationId;
  }

  static formatLogMessage(message: string): string {
    const correlationId = this.getCorrelationId();
    const correlationPart = correlationId ? ` [${correlationId}]` : '';

    return `${correlationPart} ${message}`;
  }
}
