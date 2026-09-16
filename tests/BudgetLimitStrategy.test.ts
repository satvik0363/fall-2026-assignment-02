import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetLimitStrategy } from '../src/strategies/BudgetLimitStrategy.js';
import { BudgetService } from '../src/services/BudgetService.js';
import { Transaction } from '../src/models.js';

describe('BudgetLimitStrategy (Feature 1)', () => {
    let strategy: BudgetLimitStrategy;

    beforeEach(() => {
        strategy = new BudgetLimitStrategy();
        vi.restoreAllMocks();
    });

    it('Should group expenses, calculate overages, and itemize categories that are over the budget', async () => {
        const mockBudgets = { Food: 100, Rent: 1000 };
        const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolveValue(mockBudgets);

        const testTransactions: Transaction[] = [
            { id: '1', date: '2026-05-01', amount: -150.00, category: 'Food', description: 'Grocery', status: 'completed' },
            { id: '2', date: '2026-05-02', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' },
            { id: '3', date: '2026-05-03', amount: -90.00, category: 'Rent', description: 'Utilities', status: 'completed' },
            { id: '4', date: '2026-05-04', amount: 50.00, category: 'Food', description: 'Refund', status: 'completed' },
        ];

        const result = await strategy.execute(testTransactions);

        expect(spy).toHaveBeenCalled();

        expect(result).toContain('Category: Food | Limit: $100.00 | Actual Spending: $150.00');
        expect(result).toContain('Category: Rent | Limit: $1000.00 | Actual Spending: $900.00');

        expect(result).toContain('[WARNING] Food: Exceeded by $50.00 (150.0%)');
        expect(result).not.toContain('[WARNING] Rent');


        expect(result).toContain('Food');
        expect(result).toContain('Rent');
        expect(result).not.toContain('Apartment');
    });

    it('should handle scenarios where no categories are over the budget', async () => {
        const mockBudgets = { Food: 200, Rent: 1000 };
        vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolveValue(mockBudgets);

        const testTransactions: Transaction[] = [
            { id: '1', date: '2026-05-01', amount: -50.00, category: 'Food', description: 'Chips', status: 'completed' },
        ];
        const result = await strategy.execute(testTransactions);

        expect(result).toContain('No budget limits exceeded.');
        expect(result).toContain('No overage transactions to report.');
    });
    it('should should handle empty transaction lists gracefully', async () => {
        const mockBudgets = { Food: 100, Rent: 1000 };
        vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolveValue(mockBudgets);
        const result = await strategy.execute([]);

        expect(result).toContain('Category: Food | Limit: $100.00 | Actual Spending: $0.00');
        expect(result).toContain('No budget limits exceeded.');
    });

    it('should handle spending in categories without an explicit budget limit ($0/undefined)', async () => {
        const mockBudgets = {};
        vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolveValue(mockBudgets);
        const testTransactions: Transaction[] = [
            { id: '1', date: '2026-05-01', amount: -45.00, category: 'Entertainment', description: 'Movies', status: 'completed' },
        ];

        const result = await strategy.execute(testTransactions);

        expect(result).toContain('[WARNING] Entertainment: Exceeded by $45.00 (N/A%)');
    });
});