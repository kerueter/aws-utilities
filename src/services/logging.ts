export class LoggingService {
  private static instance: LoggingService;

  /**
   * 
   */
  private constructor() {}

  /**
   * 
   */
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }

    return LoggingService.instance;
  }

  /**
   * 
   * @param message 
   * @param error 
   */
  log(message: any, error?: boolean) {
    if (typeof message !== "string") {
      const parts = new Array<string>();

      if (message.stack !== undefined) {
        parts.push(message.stack);
      }

      if (message.message !== undefined && parts.join().indexOf(message.message) < 0) {
        parts.unshift(message.message);
      }

      if (parts && parts.length > 0) {
        message = parts.join("\n");
      }
    }

    let logMessage = `${this.currentDateTime()}\t\t${message}`;
    if (error) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   *
   */
  private currentDateTime(): string {
    const date = new Date();

    return `${date.getUTCFullYear()}-${this.appendZero(
      date.getUTCMonth() + 1
    )}-${this.appendZero(date.getUTCDate())} ${this.appendZero(
      date.getUTCHours()
    )}:${this.appendZero(date.getUTCMinutes())}:${this.appendZero(
      date.getUTCSeconds()
    )} UTC`;
  }

  /**
   *
   * @param number
   */
  private appendZero(number: number): string {
    return `${number < 10 ? "0" : ""}${number}`;
  }
}