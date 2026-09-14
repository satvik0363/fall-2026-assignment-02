import { Transaction } from '../models.js';
import { BudgetService } from '../services/BudgetService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class BudgetLimitStrategy implements AuditStrategy {
  public readonly name = 'Budget Limit Auditor';
  public readonly description =
    'Checks category spending against monthly budget limits';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {

    // TODO: Feature 1 - Implement this strategy.
    // 1. Call BudgetService.getCategoryBudgets() asynchronously.
    async function budgetList() {
        const budget = await BudgetService.getCategoryBudgets();
    }
    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    
    // 3. Compare spending against the fetched limits.
    // 4. Identify overages (categories where spending exceeds the budget).
    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.

    throw new Error('Method not implemented.');
  }
}
