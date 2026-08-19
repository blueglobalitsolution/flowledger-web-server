import type { Category } from '@shared/types';

export const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.9:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

const TODAY = new Date().toISOString().split('T')[0];

export function accountConstraint(accounts?: string[]): string {
  const list = (accounts ?? []).filter((a) => typeof a === 'string' && a.trim().length > 0);
  if (list.length === 0) return '';
  return `\nThe user's real accounts are: ${list.join(', ')}. The account field MUST be exactly one of those values, using the user's exact spelling and casing. Never invent account names.`;
}

/// Serializes the business's category tree into the system prompt so the model
/// classifies against the user's real categories (any business type).
export function buildCategoryInstruction(categories: Category[]): string {
  const topLevels = categories.filter((c) => !c.path?.includes(' > '));
  const leaves = categories.filter((c) => c.path?.includes(' > '));

  const byType: Record<string, string[]> = { income: [], expense: [], transfer: [] };
  for (const group of topLevels) {
    const children = leaves
      .filter((l) => l.parent === (group.path ?? group.name))
      .map((l) => l.name);
    if (children.length === 0) continue;
    const list = `${group.name}: ${children.join(', ')}`;
    if (byType[group.type]) byType[group.type].push(list);
  }

  return [
    '\nCATEGORIES (choose the exact "Parent > Subcategory" path, e.g. "Food & Beverages > Restaurant"):',
    byType.income.length ? `Income:\n${byType.income.map((l) => `- ${l}`).join('\n')}` : '',
    byType.expense.length ? `Expense:\n${byType.expense.map((l) => `- ${l}`).join('\n')}` : '',
    byType.transfer.length ? `Transfer:\n${byType.transfer.map((l) => `- ${l}`).join('\n')}` : '',
    'The category field MUST be one of those exact paths. Match the description to the most specific subcategory. Never invent categories.',
  ]
    .filter(Boolean)
    .join('\n');
}


export function buildCustomerInstruction(customers?: any[]): string {
  if (!customers || customers.length === 0) return '';
  // Simplify color values for prompt readability
  const simplified = customers.map(c => ({
    name: c.name,
    labelName: c.labelName,
    baseIncome: c.baseIncome,
    baseExpense: c.baseExpense,
    service: c.service
  }));
  return `\nCUSTOMERS LIST (FOR RETRIEVING CUSTOMER LEDGERS):
${JSON.stringify(simplified)}
If the user asks to "show ledger", "show details", "check balance", "how much is", or any query regarding a specific customer's ledger, you MUST return a JSON object with this EXACT structure:
{
  "type": "customer_ledger",
  "customer": { ... the matching customer object from the list (with original id/color if known, otherwise just name) ... },
  "description": "A brief conversational summary of this customer's details (e.g. 'Here is the ledger card for John Doe. They are a VIP client with a base income of ...')",
  "confidence": 99
}
\
`;
}

export function buildSystemInstruction(categories?: Category[], accounts?: string[], customers?: any[]): string {
  const categorySection = categories?.length ? buildCategoryInstruction(categories) : '';
  return [
    'You are a finance parser. Extract transaction details. Always return valid JSON. Never explain. Never add markdown.',
    'Return:',
    "- type: 'income' | 'expense' | 'transfer' | 'customer_ledger' | 'chat'",
    "If the user is asking a general question, asking for help, greeting you, listing customers, or just chatting, set type to 'chat', and write your conversational reply in the description field. Set amount to 0, confidence to 99, and leave other fields empty/default.",
    '- amount: number (numeric value only)',
    "- currency: '₹' | '$' | '€' | '£'",
    '- category: string (see CATEGORIES below)',
    '- description: string',
    '- account: string',
    "- payment_method: string (e.g. 'Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Cheque', 'Net Banking')",
    `- date: YYYY-MM-DD string (default to today ${TODAY} if not mentioned)`,
    '- tags: array of strings from [Personal, Business, Family, Office, Travel, Tax Deductible, Reimbursable, Urgent, Recurring, One-Time, Client Project, Investment, Emergency] (infer the most relevant 1-3)',
    '- confidence: number between 60 and 99 reflecting confidence score',
    '- customerId: string or null (If the transaction is related to a customer in the CUSTOMERS LIST, match their name and provide their exact ID. Set to null if no customer matches.)',

    categorySection,
    accountConstraint(accounts),
    buildCustomerInstruction(customers),
  ]
    .filter(Boolean)
    .join('\n');
}

/// Maps a parsed account name onto the user's real accounts. When accounts are
/// constrained, never returns a name that does not exist in the list.
export function resolveAccount(parsed: string | undefined, accounts?: string[], text?: string): string {
  const list = (accounts ?? []).filter((a) => typeof a === 'string' && a.trim().length > 0);
  if (list.length === 0) return parsed || 'Physical Wallet';
  const clean = (parsed ?? '').trim();
  const exact = list.find((a) => a.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;
  const lower = (text ?? '').toLowerCase();
  const mentioned = list.find((a) => a.trim() && lower.includes(a.toLowerCase()));
  return mentioned ?? list[0];
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const KNOWN_TAGS = [
  'Personal',
  'Business',
  'Family',
  'Office',
  'Travel',
  'Tax Deductible',
  'Reimbursable',
  'Urgent',
  'Recurring',
  'One-Time',
  'Client Project',
  'Investment',
  'Emergency',
];

const TAG_RULES: Array<{ tag: string; words: string[] }> = [
  { tag: 'Tax Deductible', words: ['gst', 'tds', 'tax', 'income tax', 'professional tax', 'property tax'] },
  { tag: 'Recurring', words: ['salary', 'rent', 'emi', 'subscription', 'monthly', 'recharge', 'insurance', 'internet', 'broadband'] },
  { tag: 'Client Project', words: ['client', 'project', 'customer'] },
  { tag: 'Business', words: ['office', 'business', 'vendor', 'raw material', 'invoice', 'freelance', 'marketing', 'ad'] },
  { tag: 'Investment', words: ['investment', 'sip', 'mutual fund', 'stock', 'dividend'] },
  { tag: 'Travel', words: ['flight', 'hotel', 'travel', 'taxi', 'trip', 'visa'] },
  { tag: 'Office', words: ['office', 'coworking', 'workspace'] },
  { tag: 'Family', words: ['family', 'with family'] },
  { tag: 'Urgent', words: ['urgent', 'emergency', 'immediately'] },
  { tag: 'Reimbursable', words: ['reimbursable', 'reimburse'] },
  { tag: 'One-Time', words: ['one-time', 'one time'] },
  { tag: 'Emergency', words: ['emergency'] },
];

export function inferTags(text: string, categoryPath?: string): string[] {
  const lower = ` ${norm(text)} `;
  const tags = new Set<string>();
  for (const rule of TAG_RULES) {
    if (rule.words.some((w) => lower.includes(w))) tags.add(rule.tag);
  }
  const cat = norm(categoryPath ?? '');
  if (cat.includes('investment') || cat.includes('salary') || cat.includes('business income') || cat.includes('freelanc')) tags.add('Business');
  if (cat.includes('tax')) tags.add('Tax Deductible');
  return Array.from(tags).slice(0, 4);
}

/**
 * Deterministic category resolver. Builds a keyword -> paths index from the
 * business's categories and overrides the AI's category when a unique strong
 * match exists in the description. Income/expense mismatches are corrected.
 * Returns the resolved category path + inferred tags.
 */
export function resolveCategory(
  type: 'income' | 'expense' | 'transfer',
  parsedCategory: string | undefined,
  text: string,
  categories: Category[]
): { category: string; tags: string[] } {
  const lower = norm(text);
  const valid = (p: string | undefined): p is string => !!p && (categories.some((c) => c.path === p) || categories.some((c) => c.parent === p));

  // Build keyword -> candidate paths index. Prefer leaf paths: if a keyword
  // matches both a top-level group and a leaf, keep only the leaf(s).
  const index = new Map<string, string[]>();
  const addKeyword = (kw: string, path: string) => {
    const key = norm(kw);
    if (key.length < 2) return;
    const isLeaf = path.includes(' > ');
    const arr = index.get(key) ?? [];
    if (isLeaf) {
      const filtered = arr.filter((p) => p.includes(' > '));
      if (!filtered.includes(path)) filtered.push(path);
      index.set(key, filtered);
    } else if (!arr.some((p) => p.includes(' > '))) {
      if (!arr.includes(path)) arr.push(path);
      index.set(key, arr);
    }
  };
  for (const c of categories) {
    const path = c.path ?? c.name;
    if (c.keywords) for (const kw of c.keywords) addKeyword(kw, path);
    addKeyword(c.name, path);
    if (c.parent && c.parent !== path) addKeyword(c.parent, path);
  }

  // Score matched keywords: prefer longer (more specific) keywords.
  let bestPath: string | null = null;
  let bestKeyLen = 0;
  for (const [key, paths] of index) {
    if (!lower.includes(` ${key} `) && !lower.startsWith(`${key} `) && !lower.endsWith(` ${key}`) && lower !== key) continue;
    if (key.length > bestKeyLen && paths.length === 1) {
      // unambiguous, longer-than-current match
      const candidate = paths[0];
      if (candidate !== bestPath) {
        bestPath = candidate;
        bestKeyLen = key.length;
      }
    }
  }

  let category: string | undefined;
  if (bestPath) {
    category = bestPath;
  } else if (valid(parsedCategory)) {
    category = parsedCategory;
  }

  // Enforce type correctness.
  const okType = (path: string, t: string) => {
    const c = categories.find((x) => x.path === path);
    return !c || c.type === t;
  };
  if (category && !okType(category, type)) {
    const group = categories.find((x) => x.path === category);
    if (group && group.parent === group.path) {
      // top-level of wrong type; fall through to default
    }
    category = undefined;
  }

  if (!category) {
    // Deterministic default by keywords + type.
    const isIncome = type === 'income' || 
      lower.includes('received') || 
      lower.includes('receive') || 
      lower.includes('recive') || 
      lower.includes('recieved') || 
      lower.includes('got') || 
      lower.includes('credited') || 
      lower.includes('deposit') || 
      lower.includes('salary') || 
      lower.includes('client') || 
      lower.includes('paid me');
    const isExpense = !isIncome;
    if (type === 'income' || isIncome) {
      if (lower.includes('salary')) category = 'Salary > Monthly Salary';
      else if (lower.includes('freelanc') || lower.includes('design') || lower.includes('web') || lower.includes('development')) category = 'Freelancing > Design';
      else if (lower.includes('dividend')) category = 'Investment > Dividend';
      else if (lower.includes('refund') || lower.includes('cashback')) category = 'Refund > Product Refund';
      else if (lower.includes('rent')) category = 'Rental Income > House Rent';
      else if (lower.includes('loan')) category = 'Loan Received > Personal Loan';
      else if (lower.includes('client') || lower.includes('project') || lower.includes('service')) category = 'Business Income > Client Payment';
      else category = 'Other Income > Miscellaneous';
    } else if (type === 'transfer') {
      category = 'Transfers > Bank to Bank';
    } else {
      category = 'Miscellaneous > Others';
    }
    // Apply keyword override on top of the default too.
    if (bestPath && okType(bestPath, type)) category = bestPath;
  }

  return { category, tags: inferTags(text, category) };
}

export async function isOllamaConnected(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function parseWithOllama(text: string, accounts?: string[], categories?: Category[], customers?: any[]): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `Parse this financial utterance into JSON: "${text}"`,
        system: buildSystemInstruction(categories, accounts, customers),
        format: 'json',
        stream: false,
        options: { temperature: 0, num_predict: 400 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama responded with status ${res.status}`);
    const data = await res.json();
    const rawJson = data?.response;
    if (rawJson && typeof rawJson === 'string') {
      return JSON.parse(rawJson.trim());
    }
    return null;
  } catch (err) {
    console.error('Ollama call failed, falling back to smart regex engine:', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Fallback Financial Smart Parser (regex) used when Ollama is unreachable or returns invalid JSON
export function fallbackParseFinancialText(text: string, accounts?: string[], categories?: Category[]): any {
  const lower = text.toLowerCase();

  const amountMatch = text.match(/(?:[₹$€£]\s*|\b)(\d+(?:\.\d{1,2})?)\b/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 30;

  let currency = '₹';
  if (text.includes('$')) currency = '$';
  else if (text.includes('€')) currency = '€';
  else if (text.includes('£')) currency = '£';

  let type: 'income' | 'expense' | 'transfer' = 'expense';
  if (
    lower.includes('salary') || 
    lower.includes('received') || 
    lower.includes('receive') || 
    lower.includes('recive') || 
    lower.includes('recieved') || 
    lower.includes('got') || 
    lower.includes('get') || 
    lower.includes('credited') || 
    lower.includes('deposit') || 
    lower.includes('refund') || 
    lower.includes('freelance') || 
    lower.includes('paid me')
  ) {
    type = 'income';
  } else if (lower.includes('transfer') || lower.includes('moved to') || lower.includes('sent to bank') || lower.includes('to bank') || lower.includes('to cash')) {
    type = 'transfer';
  }

  let payment_method = 'UPI';
  let account = 'Physical Wallet';

  if (lower.includes('card')) {
    payment_method = 'Credit Card';
  } else if (lower.includes('cash')) {
    payment_method = 'Cash';
  } else if (lower.includes('cheque') || lower.includes('check')) {
    payment_method = 'Cheque';
  } else if (lower.includes('wallet') || lower.includes('paytm')) {
    payment_method = 'Wallet';
  } else if (lower.includes('net banking') || lower.includes('neft') || lower.includes('imps') || lower.includes('rtgs')) {
    payment_method = 'Net Banking';
  } else if (type === 'income') {
    payment_method = 'Bank Transfer';
  }

  const resolved = resolveCategory(type, undefined, text, categories ?? []);
  const category = resolved.category;

  let confidence = 96;
  if (lower.includes('maybe') || lower.includes('stuff') || text.length < 5) {
    confidence = 74;
  } else if (lower.includes('snacks') || lower.includes('food?')) {
    confidence = 88;
  } else if (lower.includes('tea') && amount === 30) {
    confidence = 98;
  }

  return {
    type,
    amount,
    currency,
    category,
    description: text.trim(),
    account: resolveAccount(account, accounts, text),
    payment_method,
    date: TODAY,
    confidence,
    tags: resolved.tags,
  };
}
