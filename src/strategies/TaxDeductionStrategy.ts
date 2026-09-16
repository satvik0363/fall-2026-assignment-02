import { Transaction } from '../models.js';
import { TaxConfigService } from '../services/TaxConfigService.js';
import { AuditStrategy } from './AuditStrategy.js';


export class TaxDeductionStrategy implements AuditStrategy {
  public readonly name = 'Tax & Deductions Auditor';
  public readonly description =
    'Identifies eligible tax-deductible expenses and estimates savings';


  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 4 - Implement this strategy.
    // 1. Call TaxConfigService.getTaxConfig() asynchronously.


    const {standardTaxRate, deductibleCategories} = await TaxConfigService.getTaxConfig();
    const eligibleSet = new Set(deductibleCategories);


    // 2. Filter expenses (amount < 0) that belong to eligible tax-deductible categories.


    const deductibleTransactions: Transaction[] = [];
    const nonDeductibleTransactions: Transaction[] = [];


    for (const transaction of transactions) {
      if (transaction.amount >= 0) continue;


      if (eligibleSet.has(transaction.category)) {
        deductibleTransactions.push(transaction);
      }
      else {
        nonDeductibleTransactions.push(transaction);
      }
    }


    // 3. Sum total deductible expenses.


    const totalDeductibles = deductibleTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);


    // 4. Estimate tax savings based on the standard tax rate: total deductible * taxRate.


    const estimatedTaxSavings = totalDeductibles * standardTaxRate;


    // 5. Estimate sales tax/VAT paid on NON-deductible expenses using standard tax rate.


    const nonDeductibles = nonDeductibleTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);


    const vatPaid = nonDeductibles * standardTaxRate;


    // 6. Format and return a text-based audit report detailing total deductions, savings, VAT estimates, and eligible transactions.


    const lines: string[] = [];


    lines.push(this.name);
    lines.push(this.description);
    lines.push(`Standard Tax Rate: ${(standardTaxRate * 100)}%`);
    lines.push(`Eligible Deductible Categories: ${deductibleCategories.join(', ')}`);


    lines.push("ELIGIBLE DEDUCTIBLE TRANSACTIONS");
    if (deductibleTransactions.length == 0) {
      lines.push("No eligible transactions");
    }
    else {
      for (const transaction of deductibleTransactions) {
        lines.push(`${transaction.date} ${transaction.category} ${transaction.description} ${transaction.amount}`);
      }
    }


    lines.push(`Total Deductions: ${totalDeductibles}`);
    lines.push(`Estimated tax saving: ${estimatedTaxSavings}`);
    lines.push(`Estimated VAT: ${vatPaid}`);


    return lines.join("\n");
  }
}