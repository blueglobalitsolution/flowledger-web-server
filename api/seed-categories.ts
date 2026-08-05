import type { Category } from '@shared/types';

export const SEPARATOR = ' > ';

export interface SeedGroup {
  parent: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  groupKeywords?: string[];
  children: Array<{ name: string; keywords?: string[] }>;
}

// Full business-agnostic taxonomy. Leaf names may repeat across parents
// (e.g. Electricity in Office & Household); the unique path disambiguates.
export const CATEGORY_TREE: SeedGroup[] = [
  // ---------- INCOME ----------
  { parent: 'Business Income', type: 'income', icon: 'Briefcase', color: '#10B981', groupKeywords: ['client payment', 'project payment', 'product sale', 'service income', 'invoice', 'consultation fee', 'commission'],
    children: [
      { name: 'Client Payment', keywords: ['client', 'client payment', 'customer payment'] },
      { name: 'Project Payment', keywords: ['project', 'project payment'] },
      { name: 'Product Sale', keywords: ['product sale', 'sold product', 'sale amount'] },
      { name: 'Service Income', keywords: ['service', 'service charge', 'service income'] },
      { name: 'Consultation', keywords: ['consultation', 'consulting fee'] },
      { name: 'Commission', keywords: ['commission'] },
    ] },
  { parent: 'Salary', type: 'income', icon: 'Wallet', color: '#10B981', groupKeywords: ['salary', 'monthly salary', 'paycheck'],
    children: [
      { name: 'Monthly Salary', keywords: ['salary', 'monthly salary'] },
      { name: 'Bonus', keywords: ['bonus'] },
      { name: 'Incentive', keywords: ['incentive'] },
      { name: 'Overtime', keywords: ['overtime', 'overtime pay'] },
    ] },
  { parent: 'Freelancing', type: 'income', icon: 'Code', color: '#8B5CF6', groupKeywords: ['freelance', 'freelancer', 'gig', 'contract work'],
    children: [
      { name: 'Web Development', keywords: ['web development', 'website', 'web dev'] },
      { name: 'Design', keywords: ['design', 'graphic design', 'logo'] },
      { name: 'Marketing', keywords: ['marketing', 'social media marketing', 'smm'] },
      { name: 'Development', keywords: ['development', 'software development', 'app development'] },
      { name: 'Consulting', keywords: ['consulting', 'consultant'] },
    ] },
  { parent: 'Investment', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', groupKeywords: ['investment', 'dividend', 'stock', 'mutual fund'],
    children: [
      { name: 'Dividend', keywords: ['dividend'] },
      { name: 'Mutual Fund', keywords: ['mutual fund', 'mf redemption', 'mf profit'] },
      { name: 'Stock Profit', keywords: ['stock profit', 'shares profit', 'stock sale'] },
      { name: 'Interest', keywords: ['interest income', 'interest received', 'savings interest'] },
      { name: 'Capital Gain', keywords: ['capital gain', 'capital gains'] },
    ] },
  { parent: 'Rental Income', type: 'income', icon: 'Home', color: '#10B981', groupKeywords: ['rent received', 'rental', 'tenant'],
    children: [
      { name: 'House Rent', keywords: ['house rent', 'home rent', 'flat rent'] },
      { name: 'Shop Rent', keywords: ['shop rent', 'store rent'] },
      { name: 'Equipment Rent', keywords: ['equipment rent', 'machine rent'] },
    ] },
  { parent: 'Loan Received', type: 'income', icon: 'HandCoins', color: '#10B981', groupKeywords: ['loan received', 'borrowed', 'loan credited'],
    children: [
      { name: 'Personal Loan', keywords: ['personal loan'] },
      { name: 'Business Loan', keywords: ['business loan'] },
    ] },
  { parent: 'Refund', type: 'income', icon: 'Undo2', color: '#10B981', groupKeywords: ['refund', 'cashback', 'reversal'],
    children: [
      { name: 'Product Refund', keywords: ['product refund', 'order refund', 'amazon refund', 'flipkart refund'] },
      { name: 'Tax Refund', keywords: ['tax refund', 'itr refund', 'income tax refund'] },
      { name: 'Cashback', keywords: ['cashback'] },
    ] },
  { parent: 'Gifts', type: 'income', icon: 'Gift', color: '#10B981', groupKeywords: ['gift received', 'gifted'],
    children: [
      { name: 'Family Gift', keywords: ['family gift', 'gift from family'] },
      { name: 'Business Gift', keywords: ['business gift', 'corporate gift'] },
    ] },
  { parent: 'Other Income', type: 'income', icon: 'Plus', color: '#10B981', groupKeywords: ['misc income', 'other income'],
    children: [{ name: 'Miscellaneous', keywords: ['miscellaneous', 'misc income'] }] },

  // ---------- EXPENSE ----------
  { parent: 'Food & Beverages', type: 'expense', icon: 'Utensils', color: '#EF4444', groupKeywords: ['food', 'eat', 'eat out', 'order', 'delivery', 'restaurant', 'snacks', 'meal'],
    children: [
      { name: 'Tea', keywords: ['tea', 'chai'] },
      { name: 'Coffee', keywords: ['coffee', 'latte', 'cappuccino', 'cafe'] },
      { name: 'Breakfast', keywords: ['breakfast'] },
      { name: 'Lunch', keywords: ['lunch'] },
      { name: 'Dinner', keywords: ['dinner'] },
      { name: 'Snacks', keywords: ['snacks', 'namkeen', 'chaat'] },
      { name: 'Restaurant', keywords: ['restaurant', 'hotel', 'dining', 'eatery'] },
      { name: 'Fast Food', keywords: ['fast food', 'burger', 'pizza', 'swiggy', 'zomato', 'dominos', 'mcdonald'] },
      { name: 'Groceries', keywords: ['groceries', 'grocery', 'supermarket', 'bigbasket', 'kirana', 'veg shop', 'bakery', 'baklava'] },
      { name: 'Milk', keywords: ['milk'] },
      { name: 'Fruits', keywords: ['fruits', 'apple', 'banana', 'fruit shop'] },
      { name: 'Vegetables', keywords: ['vegetables', 'sabzi', 'tomatoes', 'onions', 'produce'] },
      { name: 'Water', keywords: ['drinking water', 'water bottle', 'aquafina', 'kinley'] },
    ] },
  { parent: 'Transportation', type: 'expense', icon: 'Car', color: '#3B82F6', groupKeywords: ['transport', 'travel commute', 'fuel', 'cab', 'vehicle'],
    children: [
      { name: 'Petrol', keywords: ['petrol', 'fuel', 'indian oil', 'bharat petroleum', 'hp petrol'] },
      { name: 'Diesel', keywords: ['diesel'] },
      { name: 'CNG', keywords: ['cng', 'gas for vehicle'] },
      { name: 'EV Charging', keywords: ['ev charging', 'electric vehicle charge'] },
      { name: 'Auto Rickshaw', keywords: ['auto', 'rickshaw', 'autowala'] },
      { name: 'Taxi', keywords: ['taxi', 'cabbie'] },
      { name: 'Uber', keywords: ['uber'] },
      { name: 'Ola', keywords: ['ola'] },
      { name: 'Bus', keywords: ['bus fare', 'bus ticket'] },
      { name: 'Train', keywords: ['train', 'railway'] },
      { name: 'Flight', keywords: ['flight', 'airfare', 'air ticket'] },
      { name: 'Parking', keywords: ['parking'] },
      { name: 'Toll', keywords: ['toll', 'toll tax', 'fastag', 'fasttag'] },
      { name: 'Vehicle Service', keywords: ['vehicle service', 'car service', 'bike service', 'servicing'] },
      { name: 'Car Wash', keywords: ['car wash', 'vehicle wash'] },
    ] },
  { parent: 'Office', type: 'expense', icon: 'Building2', color: '#EF4444', groupKeywords: ['office', 'office expense', 'workspace'],
    children: [
      { name: 'Office Rent', keywords: ['office rent', 'workspace rent', 'co-working', 'coworking'] },
      { name: 'Office Supplies', keywords: ['office supplies', 'stationery', 'office stationery'] },
      { name: 'Furniture', keywords: ['office furniture', 'desk', 'chair', 'table'] },
      { name: 'Stationery', keywords: ['stationery', 'pens', 'notebooks', 'paper'] },
      { name: 'Printer', keywords: ['printer', 'print cartridges'] },
      { name: 'Toner', keywords: ['toner', 'ink'] },
      { name: 'Electricity', keywords: ['office electricity', 'electricity bill', 'bijli'] },
      { name: 'Water', keywords: ['office water', 'water bill'] },
      { name: 'Internet', keywords: ['office internet', 'broadband office'] },
      { name: 'Telephone', keywords: ['telephone', 'landline', 'phone bill'] },
      { name: 'Courier', keywords: ['office courier', 'courier charge'] },
      { name: 'Cleaning', keywords: ['cleaning', 'office cleaning', 'housekeeping'] },
    ] },
  { parent: 'Employee', type: 'expense', icon: 'Users', color: '#EF4444', groupKeywords: ['employee', 'staff', 'team', 'worker'],
    children: [
      { name: 'Salary', keywords: ['employee salary', 'staff salary', 'team salary', 'wages'] },
      { name: 'Incentive', keywords: ['employee incentive', 'staff incentive'] },
      { name: 'Bonus', keywords: ['employee bonus', 'staff bonus'] },
      { name: 'Freelancer Payment', keywords: ['freelancer payment', 'contractor payment', 'outsource'] },
      { name: 'Contractor', keywords: ['contractor'] },
      { name: 'PF', keywords: ['pf', 'provident fund'] },
      { name: 'ESIC', keywords: ['esic'] },
    ] },
  { parent: 'Marketing', type: 'expense', icon: 'Megaphone', color: '#F59E0B', groupKeywords: ['marketing', 'ad', 'advertising', 'campaign'],
    children: [
      { name: 'Facebook Ads', keywords: ['facebook ads', 'fb ads', 'meta ads'] },
      { name: 'Google Ads', keywords: ['google ads', 'adwords', 'ppc'] },
      { name: 'Instagram Ads', keywords: ['instagram ads', 'ig ads'] },
      { name: 'LinkedIn Ads', keywords: ['linkedin ads'] },
      { name: 'Newspaper', keywords: ['newspaper ad', 'newspaper'] },
      { name: 'Banner', keywords: ['banner', 'hoarding'] },
      { name: 'Visiting Cards', keywords: ['visiting cards', 'business cards'] },
      { name: 'Printing', keywords: ['marketing printing', 'print ads'] },
      { name: 'Promotional Material', keywords: ['promotional', 'promo material', 'merchandise'] },
    ] },
  { parent: 'Software & Technology', type: 'expense', icon: 'Monitor', color: '#8B5CF6', groupKeywords: ['software', 'saas', 'subscription', 'tech', 'tool'],
    children: [
      { name: 'Domain', keywords: ['domain', 'domain name', 'godaddy'] },
      { name: 'Hosting', keywords: ['hosting', 'web hosting'] },
      { name: 'VPS', keywords: ['vps', 'virtual server'] },
      { name: 'Cloud Server', keywords: ['cloud', 'aws', 'azure', 'gcp', 'cloud server'] },
      { name: 'OpenAI', keywords: ['openai', 'gpt', 'api openai'] },
      { name: 'ChatGPT', keywords: ['chatgpt', 'chat gpt plus'] },
      { name: 'Canva', keywords: ['canva'] },
      { name: 'Adobe', keywords: ['adobe', 'photoshop', 'illustrator', 'creative cloud'] },
      { name: 'Microsoft', keywords: ['microsoft', 'office 365', 'microsoft 365'] },
      { name: 'Google Workspace', keywords: ['google workspace', 'google one', 'gmail'] },
      { name: 'API Charges', keywords: ['api', 'api charges', 'api usage'] },
      { name: 'SaaS Subscription', keywords: ['saas', 'subscription'] },
      { name: 'SSL', keywords: ['ssl', 'ssl certificate'] },
      { name: 'Software License', keywords: ['software license', 'license fee', 'license'] },
    ] },
  { parent: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', groupKeywords: ['shopping', 'buy', 'purchase', 'retail'],
    children: [
      { name: 'Clothes', keywords: ['clothes', 'clothing', 'dress', 'shirt', 'jeans', 'kurta'] },
      { name: 'Shoes', keywords: ['shoes', 'footwear', 'sneakers'] },
      { name: 'Electronics', keywords: ['electronics', 'gadgets', 'earphones', 'speaker', 'watch'] },
      { name: 'Mobile', keywords: ['mobile', 'phone', 'smartphone'] },
      { name: 'Laptop', keywords: ['laptop', 'macbook', 'computer'] },
      { name: 'Accessories', keywords: ['accessories', 'bag', 'backpack'] },
      { name: 'Home Decor', keywords: ['home decor', 'decor', 'curtains', 'lamps'] },
      { name: 'Gifts', keywords: ['gift purchase', 'buy gift', 'gift'] },
    ] },
  { parent: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#EF4444', groupKeywords: ['health', 'medical', 'doctor', 'treatment'],
    children: [
      { name: 'Doctor', keywords: ['doctor', 'doctor visit', 'consultation fee'] },
      { name: 'Hospital', keywords: ['hospital', 'admission'] },
      { name: 'Medicine', keywords: ['medicine', 'medicines', 'pharmacy', 'medical store', 'chemist'] },
      { name: 'Insurance', keywords: ['health insurance', 'medical insurance', 'insurance premium'] },
      { name: 'Medical Test', keywords: ['medical test', 'blood test', 'lab test', 'diagnostic'] },
      { name: 'Dental', keywords: ['dental', 'dentist', 'teeth'] },
      { name: 'Eye Care', keywords: ['eye care', 'spectacles', 'glasses', 'eye test', 'optometrist'] },
    ] },
  { parent: 'Household', type: 'expense', icon: 'Home', color: '#F59E0B', groupKeywords: ['household', 'home expense', 'domestic'],
    children: [
      { name: 'Rent', keywords: ['house rent', 'home rent', 'apartment rent'] },
      { name: 'Electricity', keywords: ['house electricity', 'home electricity', 'electricity bill'] },
      { name: 'Water', keywords: ['house water', 'home water', 'water bill'] },
      { name: 'Gas', keywords: ['gas', 'lpg', 'cooking gas', 'cylinder'] },
      { name: 'Internet', keywords: ['home internet', 'broadband', 'wifi'] },
      { name: 'Maid', keywords: ['maid', 'househelp', 'maid salary'] },
      { name: 'Repairs', keywords: ['home repairs', 'house repairs', 'plumber', 'electrician'] },
      { name: 'Furniture', keywords: ['home furniture', 'sofa', 'cupboard'] },
    ] },
  { parent: 'Education', type: 'expense', icon: 'GraduationCap', color: '#EF4444', groupKeywords: ['education', 'study', 'school', 'learning'],
    children: [
      { name: 'School Fees', keywords: ['school fees', 'school fee'] },
      { name: 'College Fees', keywords: ['college fees', 'college fee', 'tuition'] },
      { name: 'Online Course', keywords: ['online course', 'course', 'udemy', 'coursera', 'course fee'] },
      { name: 'Books', keywords: ['books', 'book', 'textbook'] },
      { name: 'Coaching', keywords: ['coaching', 'tuition fees'] },
      { name: 'Certification', keywords: ['certification', 'certificate fee'] },
    ] },
  { parent: 'Entertainment', type: 'expense', icon: 'Film', color: '#EC4899', groupKeywords: ['entertainment', 'fun', 'leisure'],
    children: [
      { name: 'Movies', keywords: ['movie', 'movies', 'cinema', 'pvr', 'theatre'] },
      { name: 'OTT', keywords: ['ott', 'netflix', 'prime video', 'hotstar', 'disney'] },
      { name: 'Music', keywords: ['music', 'spotify', 'gaana', 'apple music'] },
      { name: 'Games', keywords: ['game', 'games', 'gaming', 'steam', 'pubg', 'free fire'] },
      { name: 'Events', keywords: ['event', 'concert', 'show ticket'] },
      { name: 'Vacation', keywords: ['vacation', 'holiday', 'outing'] },
    ] },
  { parent: 'Travel', type: 'expense', icon: 'Plane', color: '#3B82F6', groupKeywords: ['travel', 'trip', 'journey'],
    children: [
      { name: 'Hotel', keywords: ['hotel', 'stay', 'oyyo', 'airbnb', 'booking'] },
      { name: 'Flight', keywords: ['flight booking', 'air ticket', 'indigo', 'goair'] },
      { name: 'Bus', keywords: ['bus booking', 'redbus'] },
      { name: 'Train', keywords: ['train booking', 'irctc'] },
      { name: 'Taxi', keywords: ['travel taxi', 'airport taxi'] },
      { name: 'Food', keywords: ['travel food', 'food during trip'] },
      { name: 'Visa', keywords: ['visa', 'visa fee'] },
      { name: 'Local Transport', keywords: ['local transport', 'local travel', 'metropolitan'] },
    ] },
  { parent: 'Financial', type: 'expense', icon: 'Banknote', color: '#3B82F6', groupKeywords: ['finance', 'banking', 'emi', 'loan'],
    children: [
      { name: 'Bank Charges', keywords: ['bank charges', 'service fee bank'] },
      { name: 'EMI', keywords: ['emi', 'equated monthly installment'] },
      { name: 'Loan Payment', keywords: ['loan payment', 'loan repayment', 'loan emi'] },
      { name: 'Credit Card Bill', keywords: ['credit card bill', 'cc bill', 'card payment'] },
      { name: 'Interest', keywords: ['interest paid', 'interest charge'] },
      { name: 'Investment', keywords: ['investment', 'invest'] },
      { name: 'SIP', keywords: ['sip', 'systematic investment'] },
      { name: 'Mutual Fund', keywords: ['mutual fund purchase', 'mf purchase', 'mf investment'] },
    ] },
  { parent: 'Tax', type: 'expense', icon: 'ReceiptText', color: '#F59E0B', groupKeywords: ['tax', 'taxes', 'government'],
    children: [
      { name: 'GST', keywords: ['gst', 'gst payment', 'gst return'] },
      { name: 'TDS', keywords: ['tds', 'tax deducted'] },
      { name: 'Income Tax', keywords: ['income tax', 'advance tax'] },
      { name: 'Professional Tax', keywords: ['professional tax'] },
      { name: 'Property Tax', keywords: ['property tax', 'house tax'] },
    ] },
  { parent: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#EC4899', groupKeywords: ['personal care', 'grooming'],
    children: [
      { name: 'Salon', keywords: ['salon', 'haircut', 'barber', 'parlour'] },
      { name: 'Spa', keywords: ['spa', 'massage'] },
      { name: 'Cosmetics', keywords: ['cosmetics', 'makeup', 'skincare', 'cream'] },
      { name: 'Gym', keywords: ['gym', 'fitness', 'workout'] },
      { name: 'Clothing', keywords: ['personal clothing', 'innerwear'] },
      { name: 'Accessories', keywords: ['personal accessories', 'wallet', 'sunglasses'] },
    ] },
  { parent: 'Pets', type: 'expense', icon: 'PawPrint', color: '#EF4444', groupKeywords: ['pet', 'dog', 'cat', 'animal'],
    children: [
      { name: 'Food', keywords: ['pet food', 'dog food', 'cat food'] },
      { name: 'Veterinary', keywords: ['vet', 'veterinary', 'pet doctor'] },
      { name: 'Accessories', keywords: ['pet accessories', 'pet toys'] },
    ] },
  { parent: 'Mobile & Telecom', type: 'expense', icon: 'Smartphone', color: '#3B82F6', groupKeywords: ['mobile', 'recharge', 'telecom'],
    children: [
      { name: 'Mobile Recharge', keywords: ['mobile recharge', 'jio recharge', 'airtel recharge', 'vi recharge'] },
      { name: 'Broadband', keywords: ['broadband', 'wifi bill', 'internet bill'] },
      { name: 'SIM Recharge', keywords: ['sim recharge', 'sim'] },
      { name: 'DTH', keywords: ['dth', 'tv recharge', 'tatasky', 'airtel digital tv'] },
    ] },
  { parent: 'Gifts & Donations', type: 'expense', icon: 'Gift', color: '#F59E0B', groupKeywords: ['donation', 'charity', 'gift giving'],
    children: [
      { name: 'Charity', keywords: ['charity', 'donate', 'donation'] },
      { name: 'Religious', keywords: ['religious', 'temple', 'donation temple', 'pooja'] },
      { name: 'Birthday', keywords: ['birthday', 'birthday gift'] },
      { name: 'Wedding', keywords: ['wedding', 'marriage', 'shagun'] },
      { name: 'Festival', keywords: ['festival', 'diwali', 'holi', 'festival gift'] },
    ] },
  { parent: 'Maintenance', type: 'expense', icon: 'Wrench', color: '#F59E0B', groupKeywords: ['maintenance', 'repair', 'fix'],
    children: [
      { name: 'Home Repair', keywords: ['home repair', 'house repair'] },
      { name: 'Office Repair', keywords: ['office repair'] },
      { name: 'Vehicle Repair', keywords: ['vehicle repair', 'car repair', 'bike repair'] },
      { name: 'Equipment Repair', keywords: ['equipment repair', 'machine repair', 'appliance repair'] },
    ] },
  { parent: 'Business Operations', type: 'expense', icon: 'Package', color: '#EF4444', groupKeywords: ['operations', 'business expense', 'vendor'],
    children: [
      { name: 'Packaging', keywords: ['packaging', 'packing material'] },
      { name: 'Shipping', keywords: ['shipping', 'shipping charge'] },
      { name: 'Courier', keywords: ['courier', 'courier charge', 'delivery charge'] },
      { name: 'Raw Material', keywords: ['raw material', 'raw materials', 'ingredients', 'stock purchase'] },
      { name: 'Manufacturing', keywords: ['manufacturing', 'production'] },
      { name: 'Vendor Payment', keywords: ['vendor payment', 'supplier payment', 'vendor bill'] },
    ] },
  { parent: 'Printing & Media', type: 'expense', icon: 'Printer', color: '#EF4444', groupKeywords: ['printing', 'media', 'photography'],
    children: [
      { name: 'Flex Printing', keywords: ['flex', 'flex printing'] },
      { name: 'Offset Printing', keywords: ['offset printing'] },
      { name: 'Digital Printing', keywords: ['digital printing'] },
      { name: 'Photography', keywords: ['photography', 'photographer'] },
      { name: 'Videography', keywords: ['videography', 'videographer'] },
    ] },
  { parent: 'Miscellaneous', type: 'expense', icon: 'Ellipsis', color: '#94A3B8', groupKeywords: ['misc', 'miscellaneous', 'other expense'],
    children: [
      { name: 'Penalty', keywords: ['penalty', 'late fee'] },
      { name: 'Fine', keywords: ['fine', 'challan'] },
      { name: 'Unexpected Expense', keywords: ['unexpected', 'emergency expense'] },
      { name: 'Others', keywords: ['other', 'others'] },
    ] },

  // ---------- TRANSFER ----------
  { parent: 'Transfers', type: 'transfer', icon: 'ArrowLeftRight', color: '#3B82F6', groupKeywords: ['transfer', 'sent to', 'moved to'],
    children: [
      { name: 'Cash to Bank', keywords: ['cash to bank', 'cash deposit'] },
      { name: 'Bank to Cash', keywords: ['bank to cash', 'withdraw cash'] },
      { name: 'Bank to Bank', keywords: ['bank to bank', 'neft', 'imps', 'rtgs', 'transfer between accounts'] },
      { name: 'Wallet to Bank', keywords: ['wallet to bank', 'paytm to bank'] },
      { name: 'UPI to Bank', keywords: ['upi to bank'] },
      { name: 'Credit Card Payment', keywords: ['credit card payment', 'cc payment'] },
    ] },
];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Cheque', 'Net Banking'];

export const ACCOUNT_TYPES = [
  'Cash',
  'Savings Account',
  'Current Account',
  'Credit Card',
  'Wallet',
  'Petty Cash',
  'Fixed Deposit',
  'Investment Account',
];

export const TRANSACTION_TAGS = [
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

let seq = 0;
function nextCatId(): string {
  seq += 1;
  return `cat-${Date.now()}-${seq}`;
}

/** Builds the flat list of Category rows (top-level rows + leaf rows). */
export function buildSeedCategories(): Category[] {
  const rows: Category[] = [];
  for (const group of CATEGORY_TREE) {
    rows.push({
      id: nextCatId(),
      name: group.parent,
      path: group.parent,
      parent: group.parent,
      type: group.type,
      icon: group.icon,
      color: group.color,
      keywords: group.groupKeywords ?? [],
    });
    for (const child of group.children) {
      rows.push({
        id: nextCatId(),
        name: child.name,
        path: `${group.parent}${SEPARATOR}${child.name}`,
        parent: group.parent,
        type: group.type,
        icon: group.icon,
        color: group.color,
        keywords: [child.name, ...(child.keywords ?? [])],
      });
    }
  }
  return rows;
}

/** Convenience helpers used by the parser/resolver. */
export function topLevelOf(path: string): string {
  return path.split(SEPARATOR)[0] ?? path;
}

export function isTopLevelPath(path: string): boolean {
  return !path.includes(SEPARATOR);
}
