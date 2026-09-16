import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendAnalysisStrategy } from '../src/strategies/TrendAnalysisStrategy.js';
import { HistoricalDataService } from '../src/services/HistoricalDataService.js';
import { Transaction } from '../src/models.js';

describe('TrendAnalysisStrategy (Feature 3)', () => {
  let strategy: TrendAnalysisStrategy;

  beforeEach(() => {
    strategy = new TrendAnalysisStrategy();
    vi.restoreAllMocks();
  });

  it('should group current expenses by category and compute accurate totals', async () => {
    const mockAverages = { Food: 200, Rent: 1000 };
    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -100.0,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -150.0,
        category: 'Food',
        description: 'Restaurant',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: 2000.0,
        category: 'Salary',
        description: 'Paycheck',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Current: $250.00');
    expect(result).toContain('Food');
    expect(result).not.toContain('Salary');
  });

  it('should calculate variance percentage from historical averages correctly', async () => {
    const mockAverages = { Food: 200, Rent: 1000 };
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue(mockAverages);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250.0,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -1000.0,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toContain('+25.0%'); // Food: (250-200)/200 = +25%
    expect(result).toContain('+0.0%'); // Rent: (1000-1000)/1000 = 0%
  });

  it('should highlight categories exceeding positive/negative 20% variance threshold', async () => {
    const mockAverages = { Food: 200, Entertainment: 100 };
    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -300.0, // +50% growth vs 200
        category: 'Food',
        description: 'Grocery splurge',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -50.0, // -50% savings vs 100
        category: 'Entertainment',
        description: 'Minimal spending',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Significant Growth Categories');
    expect(result).toContain('Food');
    expect(result).toContain('Significant Savings Categories');
    expect(result).toContain('Entertainment');
  });

  it('should handle categories present in current data but missing in historical benchmarks', async () => {
    const mockAverages = { Food: 200 };
    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue(
      mockAverages,
    );

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -75.0,
        category: 'Pets',
        description: 'Vet visit',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Pets');
    expect(result).toContain('Historical Avg: N/A');
    expect(result).toContain('Change: N/A');
    // A category with no historical benchmark should never be flagged as significant.
    const growthSection = result.split('Significant Growth Categories')[1];
    expect(growthSection).not.toContain('Pets');
  });

  it('should format historical vs current comparisons in a readable report and handle empty transactions', async () => {
    vi.spyOn(HistoricalDataService, 'getHistoricalAverages').mockResolvedValue({
      Food: 200,
    });

    const result = await strategy.execute([]);

    expect(result).toContain('HISTORICAL TREND AUDIT REPORT');
    expect(result).toContain('Category Spending Comparison:');
    expect(result).toContain('Current: $0.00');
    expect(result).toContain('Significant Growth Categories');
    expect(result).toContain('Significant Savings Categories');
    expect(result).toContain('None');
  });
});
