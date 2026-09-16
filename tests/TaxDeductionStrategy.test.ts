import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxDeductionStrategy } from '../src/strategies/TaxDeductionStrategy.js';
import { TaxConfigService } from '../src/services/TaxConfigService.js';
import { Transaction } from '../src/models.js';


describe('TaxDeductionStrategy (Feature 4)', () => {
  let strategy: TaxDeductionStrategy;


  beforeEach(() => {
    strategy = new TaxDeductionStrategy();
    vi.restoreAllMocks();
  });


  // Example of how to write and mock in your tests:
  //
  // it('should compute tax savings correctly based on rate and deductible categories', async () => {
  //   const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Medical', 'Charity'] };
  //   const spy = vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' }, // Deductible
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Non-deductible
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Deductions: $200.00'); // Sum of Charity
  //   expect(result).to Contain('Savings: $20.00'); // $200 * 0.10
  // });


  const mockTransaction = (overrides: Partial<Transaction>): Transaction => ({
    id: '1',
    date: '2026-09-16',
    amount: 0,
    category: 'Something',
    description: 'Descrption',
    status: 'completed',
    ...overrides
  });


  it('should filter only the categories specified as deductible in the config', async () => {
      const mockConfig = {standardTaxRate: 0.1, deductibleCategories: ["Medical", "Charity", "Business"]};

      vi.spyOn(TaxConfigService, "getTaxConfig").mockResolvedValue(mockConfig);
      const testTransactions: Transaction[] = [
        mockTransaction({id: "1", amount: -200, category: "Charity", description: "Donation"}),
        mockTransaction({id: "2", amount: -100, category: "Food", description: "Groceries" }),
        mockTransaction({id: "3", amount: 150, category: "Medical", description: "Refund"}),
        mockTransaction({id: "4", amount: -50, category: "Business", description: "Supplies"})
      ];
      const result = await strategy.execute(testTransactions);

      expect(result).toContain("Donation");
      expect(result).toContain("Supplies");
      expect(result).not.toContain("Groceries");
      expect(result).not.toContain("Refund");
    }
  );


  it('should sum total eligible tax deductions correctly', async () => {
      const mockConfig = {standardTaxRate: 0.1, deductibleCategories: ["Medical", "Charity", "Business"]};

      vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

      const testTransactions: Transaction[] = [
        mockTransaction({id: "1", amount: -200, category: "Charity"}),
        mockTransaction({id: "2", amount: -50, category: "Medical"}),
        mockTransaction({id: "3", amount: -75, category: "Food"})
      ];
      const result = await strategy.execute(testTransactions);

      expect(result).toContain("Total Deductions: 250");
    }
  );


  it('should calculate estimated tax savings using standardTaxRate', async () => {
      const mockConfig = {standardTaxRate: 0.1, deductibleCategories: ["Medical", "Charity", "Business"]};

      vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

      const testTransactions: Transaction[] = [
        mockTransaction({id: "1", amount: -200, category: "Charity"}),
        mockTransaction({id: "2", amount: -50, category: "Medical"})
      ];
      const result = await strategy.execute(testTransactions);

      expect(result).toContain("Estimated tax saving: 25");
    }
  );


  it('should calculate estimated VAT/sales tax paid on non-deductible expense transactions', async () => {
      const mockConfig = {standardTaxRate: 0.1, deductibleCategories: ["Medical", "Charity", "Business"]};

      vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

      const testTransactions: Transaction[] = [
        mockTransaction({id: "1", amount: -200, category: "Charity"}),
        mockTransaction({id: "2", amount: -100, category: "Food"}),
        mockTransaction({id: "3", amount: -50, category: "Entertainment"}),
        mockTransaction({id: "4", amount: 500, category: "Salary"})
      ];
      const result = await strategy.execute(testTransactions);
      
      expect(result).toContain("Estimated VAT: 15");

    }
  );


  it('should structure report to show both aggregates and itemized deductible transactions', async () => {
      const mockConfig = {standardTaxRate: 0.1, deductibleCategories: ["Medical", "Charity", "Business"]};

      vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

      const testTransactions: Transaction[] = [
        mockTransaction({id: "1", amount: -200, category: "Charity", description: "Donation"}),
        mockTransaction({id: "2", amount: -100, category: "Food", description: "Grocery"})
      ];
      const result = await strategy.execute(testTransactions);

      expect(result).toContain("Donation");
      expect(result).toContain("Total Deductions");
      expect(result).toContain("Estimated tax saving");
      expect(result).toContain("Estimated VAT");
    }
  );
});