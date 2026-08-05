// One-off taxonomy migration: re-categorize existing transactions against the
// new business taxonomy and remap legacy budgets. Idempotent — safe to re-run.
import { listBudgets, listCategories, listTransactions, recomputeBudgetSpent, updateBudget, updateTransaction } from './store';
import { resolveCategory } from './ollama';

const BUDGET_MAP: Record<string, string> = {
  restaurant: 'Food & Beverages > Restaurant',
  Restaurant: 'Food & Beverages > Restaurant',
  Petrol: 'Transportation > Petrol',
  'Shopping & Apparel': 'Shopping',
  'Food & Dining': 'Food & Beverages',
  'Transport & Fuel': 'Transportation',
  'Bills & Utilities': 'Household',
  'Salary & Income': 'Business Income',
  'Freelance & SaaS': 'Freelancing',
  Entertainment: 'Entertainment',
  'Health & Medical': 'Healthcare',
};

function main(): void {
  const categories = listCategories();

  let moved = 0;
  for (const t of listTransactions()) {
    const type = t.type === 'income' || t.type === 'transfer' ? t.type : 'expense';
    const resolved = resolveCategory(type, t.category, t.description, categories);
    if (resolved.category !== t.category) {
      updateTransaction(t.id, { category: resolved.category, tags: t.tags?.length ? t.tags : resolved.tags });
      console.log(`REMAP  ${t.description}  ->  ${resolved.category}${resolved.tags.length ? '  [' + resolved.tags.join(',') + ']' : ''}`);
      moved++;
    }
  }
  console.log(`\nTransactions re-categorized: ${moved}`);

  let budgets = 0;
  for (const b of listBudgets()) {
    const target = BUDGET_MAP[b.category] ?? b.category;
    if (target !== b.category) {
      updateBudget(b.id, { category: target });
      console.log(`BUDGET ${b.category}  ->  ${target}`);
      budgets++;
    }
  }
  console.log(`Budgets remapped: ${budgets}`);

  recomputeBudgetSpent();
  console.log('Budget spent recomputed from transactions.\n');
}

main();
