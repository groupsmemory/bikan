import { estimateTheta, UserResponse } from '@/lib/ai/irt-engine';

/**
 * BIKAN Diagnostic Service
 * Orchestrates the IRT engine for live assessment sessions
 */
export class DiagnosticSession {
  private responses: UserResponse[] = [];
  private currentTheta: number = 0;

  public addResponse(isCorrect: boolean, difficulty: number, discrimination: number = 1.2, guessing: number = 0.25) {
    this.responses.push({
      itemId: `item-${Date.now()}`,
      isCorrect,
      params: { a: discrimination, b: difficulty, c: guessing }
    });
    
    // Recalculate Theta immediately using MLEF
    this.currentTheta = estimateTheta(this.responses, this.currentTheta);
    return this.currentTheta;
  }

  public getTheta() {
    return this.currentTheta;
  }

  public getMasteryPercentage() {
    // Mapping theta (-3 to +3) to percentage (0 to 100)
    const normalized = (this.currentTheta + 3) / 6;
    return Math.min(Math.max(normalized * 100, 0), 100);
  }

  public getSessionReport() {
    return {
      theta: this.currentTheta,
      mastery: this.getMasteryPercentage(),
      count: this.responses.length,
      status: this.getMasteryPercentage() >= 90 ? 'QUALIFIED' : 'IN_PROGRESS'
    };
  }
}
