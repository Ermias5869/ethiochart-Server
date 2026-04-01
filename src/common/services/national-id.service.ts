import { Injectable, Logger } from '@nestjs/common';

export interface NationalIdVerificationResult {
  verified: boolean;
  fullName?: string;
  dateOfBirth?: string;
  message: string;
}

@Injectable()
export class NationalIdService {
  private readonly logger = new Logger(NationalIdService.name);

  /**
   * Verify a national ID against the government registry.
   * This is a mock implementation — in production, this would call
   * the Ethiopian National ID verification API.
   */
  async verify(nationalId: string): Promise<NationalIdVerificationResult> {
    this.logger.log(`Verifying national ID: ${nationalId}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: Always return verified
    return {
      verified: true,
      fullName: 'Verified Citizen',
      dateOfBirth: '1990-01-01',
      message: `National ID ${nationalId} verified successfully`,
    };
  }
}
