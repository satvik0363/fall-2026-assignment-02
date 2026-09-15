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
    const budgets = await BudgetService.getCategoryBudgets();
    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    const expenses = transactions.filter((transaction) => transaction.amount < 0);
    const spending: Record<string, {total: number; items: Transaction[]}> = {};

    for (const transaction of expenses){
        const entry = (spending[transaction.category] ??= {total: 0, items: []});
        entry.total = Math.abs(transaction.amount);
        entry.items.push(transaction);
    }
    const categories = Array.from(new Set([...Object.keys(budgets), ...Object.keys(spending)]));
    const summaryLines: string[] = [];
    const warningLines: string[] = [];
    const itemizedLines: string[] = [];
    // 3. Compare spending against the fetched limits.
     for(const category of categories){
        const limit = budgets[category] || 0;
        const {total = 0, items = []} = spending[category] || {};

        summaryLines.push('Category: ${category} | Limit: $${limit.toFixed(2)} | Actual Spending: $${total.toFixed(2)}');

        if(total > limit){
            const overage = total - limit;
            const

        }




     }
    // 4. Identify overages (categories where spending exceeds the budget).
    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.

    throw new Error('Method not implemented.');
  }
}
