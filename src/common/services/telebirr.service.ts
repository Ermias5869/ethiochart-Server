import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface TeleBirrPaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  message: string;
}

@Injectable()
export class TeleBirrService {
  private readonly logger = new Logger(TeleBirrService.name);

  /**
   * Initialize a payment via TeleBirr.
   * This is a mock implementation — in production, this would call
   * the TeleBirr payment gateway API.
   */
  async initPayment(amount: number): Promise<TeleBirrPaymentResult> {
    this.logger.log(`Initiating TeleBirr payment for amount: ${amount} ETB`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const transactionId = `TB-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Mock: Always return success
    return {
      success: true,
      transactionId,
      amount,
      status: 'completed',
      message: `Payment of ${amount} ETB processed successfully`,
    };
  }

  /**
   * Check payment status.
   */
  async checkStatus(transactionId: string): Promise<{ status: string; paid: boolean }> {
    this.logger.log(`Checking payment status for: ${transactionId}`);

    return {
      status: 'completed',
      paid: true,
    };
  }
}
