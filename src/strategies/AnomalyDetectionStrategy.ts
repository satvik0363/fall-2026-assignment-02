import { Transaction } from '../models.js';
import { AnomalyRulesService } from '../services/AnomalyRulesService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class AnomalyDetectionStrategy implements AuditStrategy {
  public readonly name = 'Anomaly & Duplicate Auditor';
  public readonly description =
    'Detects transactions exceeding thresholds and duplicate records';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 2 - Implement this strategy.
    // 1. Call AnomalyRulesService.getRules() asynchronously.
    const rules = await AnomalyRulesService.getRules(); //current rules
    // 2. Scan transactions to find outliers (expenses exceeding rules.maxTransactionAmount).
    const outliers: Transaction[] = transactions.filter((tr) => {
      return Math.abs(tr.amount) > rules.maxTransactionAmount;
    })
    // 3. Scan to identify duplicates (transactions sharing the exact same date, category, description, and amount).
    const dupeMap = new Map<string, Transaction[]>();

    transactions.forEach((tr) => {
      const key = `${tr.date}|${tr.category}|${tr.description}|${tr.amount}`;

      let group = dupeMap.get(key);
      //if key isnt in the map yet, initialize an empty array
      if (!group) {
        group = [];
        dupeMap.set(key, group);
      }

      group.push(tr);
    })

    const dupes: Transaction[][] = Array.from(dupeMap.values()).filter((group) => {
      return group.length > 1;
    })

    // 4. Identify transactions having a status that matches any in rules.flaggedStatuses.
    const flagged: Transaction[] = transactions.filter((tr) => {
      return rules.flaggedStatuses.includes(tr.status);
    })

    
    const anomalies: Transaction[] = [
      ...outliers,
      ...flagged,
      ...dupes.flat(),
    ];

    const uniqueanomalies = anomalies.filter((tr, index) => {
      return anomalies.findIndex((item) => item.id === tr.id) === index;
    })

    // 5. Calculate total flagged value and anomaly rates.
    const total = transactions.length;
    const anomalouscount = uniqueanomalies.length;
    const flaggedcount = flagged.length;
    const dupecount = dupes.length;

    const flaggedpercent = flaggedcount > 0 ? ((flaggedcount/total)*100).toFixed(2) : '0.0';
    const dupepercent = dupecount > 0 ? ((dupecount/total)*100).toFixed(2) : '0.0';
    const anompercent = anomalouscount > 0 ? ((anomalouscount/total)*100).toFixed(2) : '0.0';

    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    const retstring = `
    ${this.name}

    record count #: ${total}
    flagged records: ${flaggedcount}
    duped records: ${dupecount}

    % flagged: ${flaggedpercent}
    % duped: ${dupepercent}

    total anomalous: ${anomalouscount}
    % anomalous: ${anompercent}

    anomalous records:
    ${anomalies.map((t) => `${t.description}: $${t.amount}`).join('\n')} 

    outliers:
    ${outliers.map((t) => `${t.description}: $${t.amount}`).join('\n')}

    dupes:
    ${dupes.map((group) => group.map((t) => t.description).join(' --- '))}

    bad status:
    ${flagged.map((t) => `${t.description}: ${t.status}`).join('\n')}
    `

    return retstring;
  }
}
