import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionStrategy } from '../src/strategies/AnomalyDetectionStrategy.js';
import { AnomalyRulesService } from '../src/services/AnomalyRulesService.js';
import { Transaction } from '../src/models.js';

describe('AnomalyDetectionStrategy (Feature 2)', () => {
  let strategy: AnomalyDetectionStrategy;

  beforeEach(() => {
    strategy = new AnomalyDetectionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should detect outlier transactions exceeding threshold', async () => {
  //   const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
  //   const spy = vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -600.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Laptop');
  //   expect(result).toContain('Outlier');
  // });

  it(
    'should detect outlier transactions exceeding the configured max amount limit', async () => {
      const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
      vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
  
      const testTransactions: Transaction[] = [
          { id: '1', date: '2026-05-01', amount: -1200.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
          { id: '2', date: '2026-05-02', amount: -1000.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
        ];
      
        const result = await strategy.execute(testTransactions);
      
        expect(result).toContain('Laptop');
        expect(result).toContain('Grocery'); 
    }
  );

  it(
    'should identify duplicate transactions sharing identical date, amount, category, and description', async () => {
      const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
      vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
 
      const testTransactions: Transaction[] = [
          { id: '1', date: '2026-05-01', amount: -100.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
          { id: '2', date: '2026-05-01', amount: -100.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier dupe
          { id: '3', date: '2026-05-02', amount: -200.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
        ];
      
      const result = await strategy.execute(testTransactions);
      
      expect(result).toContain("duped records: 1");
    }
  );

  it(
    'should flag transactions matching standard flagged statuses in the rules', async () => {
      const mockRules = { maxTransactionAmount: 1000.00, flaggedStatuses: ['flagged', 'review'] };
      vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

      const testTransactions: Transaction[] = [
          { id: '1', date: '2026-05-01', amount: -50.00, category: 'Services', description: 'Subscription', status: 'flagged' },
          { id: '2', date: '2026-05-01', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' },
          
        ];
      
      const result = await strategy.execute(testTransactions);
      
      expect(result).toContain("Subscription");
      expect(result).not.toContain("Dinner");
    }
  );

  it(
    'should calculate correct transaction anomaly rates and total flagged valuation', async () => {
      const mockRules = { maxTransactionAmount: 1000.00, flaggedStatuses: ['flagged'] };
      vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

      const testTransactions: Transaction[] = [
          { id: '1', date: '2026-05-01', amount: -50.00, category: 'Services', description: 'Subscription', status: 'completed' },
          { id: '2', date: '2026-05-02', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' },
          { id: '3', date: '2026-05-03', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' },
          { id: '4', date: '2026-05-03', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' }, // this has the same date as the one before
        ];
      
      const result = await strategy.execute(testTransactions);
      
      expect(result).toContain("% anomalous: 50"); // two of four records are anomalous, should be a nice round 50%
    }
  );

  it(
    'should output a clean, readable text audit report detailing warnings', async () => {
      const mockRules = { maxTransactionAmount: 1000.00, flaggedStatuses: ['flagged'] };
      vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);

      const testTransactions: Transaction[] = [
          { id: '1', date: '2026-05-01', amount: -5000.00, category: 'Services', description: 'Subscription', status: 'completed' }, //over limit
          { id: '2', date: '2026-05-02', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' },
          { id: '3', date: '2026-05-03', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' }, // dupe
          { id: '4', date: '2026-05-03', amount: -200.00, category: 'Food', description: 'Dinner', status: 'completed' }, // this has the same date as the one before
          { id: '5', date: '2026-05-03', amount: -1200.00, category: 'Services', description: 'Car', status: 'completed' }, // so does this one
        ];
      
      const result = await strategy.execute(testTransactions);
      expect(result).toContain("outliers:");
      expect(result).toContain("dupes:");
      expect(result).toContain("bad status:");
      expect(result).toContain("% anomalous: 80");
    }
  );
});
