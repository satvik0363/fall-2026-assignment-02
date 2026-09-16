import { Transaction } from '../models.js';
import { HistoricalDataService } from '../services/HistoricalDataService.js';
import { AuditStrategy } from './AuditStrategy.js';

const SIGNIFICANT_VARIANCE_THRESHOLD = 20;

export class TrendAnalysisStrategy implements AuditStrategy {
  public readonly name = 'Historical Trend Auditor';
  public readonly description =
    'Compares current monthly category spending against historical averages';

  public async execute(
    transactions: Transaction[],
    _customParam?: string,
  ): Promise<string> {
    const historicalAverages =
      await HistoricalDataService.getHistoricalAverages();

    // Group current expenses (amount < 0) by category and compute totals.
    const currentSpending: Record<string, number> = {};
    for (const transaction of transactions) {
      if (transaction.amount < 0) {
        currentSpending[transaction.category] =
          (currentSpending[transaction.category] ?? 0) +
          Math.abs(transaction.amount);
      }
    }

    const categories = Array.from(
      new Set([
        ...Object.keys(currentSpending),
        ...Object.keys(historicalAverages),
      ]),
    ).sort();

    const tableLines: string[] = [];
    const growthLines: string[] = [];
    const savingsLines: string[] = [];

    for (const category of categories) {
      const current = currentSpending[category] ?? 0;
      const historical = historicalAverages[category];
      const hasHistorical = historical !== undefined && historical !== 0;
      const variance = hasHistorical
        ? ((current - historical) / historical) * 100
        : null;

      const historicalLabel =
        historical !== undefined ? `$${historical.toFixed(2)}` : 'N/A';
      const varianceLabel =
        variance !== null
          ? `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`
          : 'N/A';

      tableLines.push(
        `Category: ${category} | Current: $${current.toFixed(2)} | Historical Avg: ${historicalLabel} | Change: ${varianceLabel}`,
      );

      if (variance !== null && variance > SIGNIFICANT_VARIANCE_THRESHOLD) {
        growthLines.push(
          `${category}: $${current.toFixed(2)} vs historical $${historical.toFixed(2)} (${varianceLabel})`,
        );
      } else if (
        variance !== null &&
        variance < -SIGNIFICANT_VARIANCE_THRESHOLD
      ) {
        savingsLines.push(
          `${category}: $${current.toFixed(2)} vs historical $${historical.toFixed(2)} (${varianceLabel})`,
        );
      }
    }

    const reportLines: string[] = [];
    reportLines.push('HISTORICAL TREND AUDIT REPORT');
    reportLines.push('');
    reportLines.push('Category Spending Comparison:');
    if (tableLines.length > 0) {
      reportLines.push(...tableLines);
    } else {
      reportLines.push('No spending or historical data available.');
    }

    reportLines.push('');
    reportLines.push(
      `Significant Growth Categories (>+${SIGNIFICANT_VARIANCE_THRESHOLD}%):`,
    );
    reportLines.push(...(growthLines.length > 0 ? growthLines : ['None']));

    reportLines.push('');
    reportLines.push(
      `Significant Savings Categories (<-${SIGNIFICANT_VARIANCE_THRESHOLD}%):`,
    );
    reportLines.push(...(savingsLines.length > 0 ? savingsLines : ['None']));

    return reportLines.join('\n');
  }
}
