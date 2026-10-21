export const BANKS: Record<string, string> = {
  'State Bank of India': 'SBIN',
  'HDFC Bank': 'HDFC',
  'ICICI Bank': 'ICIC',
  'Axis Bank': 'UTIB',
  'Kotak Mahindra Bank': 'KKBK',
  'Punjab National Bank': 'PUNB',
  'Bank of Baroda': 'BARB',
  'Canara Bank': 'CNRB',
  'Union Bank of India': 'UBIN',
  'Bank of India': 'BKID',
  'Indian Bank': 'IDIB',
  'Central Bank of India': 'CBIN',
  'Indian Overseas Bank': 'IOBA',
  'UCO Bank': 'UCBA',
  'Bank of Maharashtra': 'MAHB',
  'Punjab & Sind Bank': 'PSIB',
  'IDBI Bank': 'IBKL',
  'IDFC FIRST Bank': 'IDFB',
  'IndusInd Bank': 'INDB',
  'Yes Bank': 'YESB',
  'Federal Bank': 'FDRL',
  'South Indian Bank': 'SIBL',
  'RBL Bank': 'RATN',
  'Bandhan Bank': 'BDBL',
  'AU Small Finance Bank': 'AUBL',
  'Karnataka Bank': 'KARB',
  'Karur Vysya Bank': 'KVBL',
  'City Union Bank': 'CIUB',
  'DCB Bank': 'DCBL',
  'Jammu & Kashmir Bank': 'JAKA',
  'Tamilnad Mercantile Bank': 'TMBL',
  'Ujjivan Small Finance Bank': 'UJVN',
  'Equitas Small Finance Bank': 'ESFB',
  'Airtel Payments Bank': 'AIRP',
  'India Post Payments Bank': 'IPOS',
  'Standard Chartered': 'SCBL',
  'HSBC': 'HSBC',
  'Citibank': 'CITI',
  'DBS Bank': 'DBSS',
};

export const BANK_NAMES = Object.keys(BANKS);

export const ifscPrefix = (bank: string) => {
  const name = BANK_NAMES.find((b) => b.toLowerCase() === bank.trim().toLowerCase());
  return name ? `${BANKS[name]}0` : '';
};

export const bankFromIfsc = (ifsc: string) => BANK_NAMES.find((b) => BANKS[b] === ifsc.slice(0, 4).toUpperCase());

const UPI_APPS: Record<string, string> = {
  ybl: 'PhonePe', ibl: 'PhonePe', axl: 'PhonePe',
  okaxis: 'Google Pay', okhdfcbank: 'Google Pay', okicici: 'Google Pay', oksbi: 'Google Pay',
  paytm: 'Paytm', ptyes: 'Paytm', ptaxis: 'Paytm', pthdfc: 'Paytm', ptsbi: 'Paytm',
  apl: 'Amazon Pay', yapl: 'Amazon Pay', rapl: 'Amazon Pay',
  upi: 'BHIM', waaxis: 'WhatsApp', wahdfcbank: 'WhatsApp', waicici: 'WhatsApp', wasbi: 'WhatsApp',
  ikwik: 'MobiKwik', freecharge: 'Freecharge', fam: 'FamPay', naviaxis: 'Navi', superyes: 'super.money', jupiteraxis: 'Jupiter',
  axisbank: 'Axis Bank', hdfcbank: 'HDFC Bank', icici: 'ICICI Bank', sbi: 'SBI', kotak: 'Kotak', kmbl: 'Kotak', yesbank: 'Yes Bank',
  pnb: 'PNB', barodampay: 'Bank of Baroda', cnrb: 'Canara Bank', unionbank: 'Union Bank', uboi: 'Union Bank', boi: 'Bank of India',
  indianbank: 'Indian Bank', centralbank: 'Central Bank', iob: 'IOB', uco: 'UCO Bank', mahb: 'Bank of Maharashtra', psb: 'Punjab & Sind Bank',
  idbi: 'IDBI Bank', idfcbank: 'IDFC FIRST', idfcfirst: 'IDFC FIRST', indus: 'IndusInd', federal: 'Federal Bank', fbl: 'Federal Bank',
  sib: 'South Indian Bank', rbl: 'RBL Bank', aubank: 'AU Bank', kbl: 'Karnataka Bank', kvb: 'Karur Vysya', cub: 'City Union Bank',
  dbs: 'DBS', hsbc: 'HSBC', jkb: 'J&K Bank', airtel: 'Airtel Payments Bank', postbank: 'India Post', allbank: 'Indian Bank',
};

export const upiApp = (id: string) => UPI_APPS[id.trim().split('@')[1]?.toLowerCase() ?? ''];

const PIN_3: Record<string, string> = {
  '160': 'Chandigarh', '194': 'Ladakh', '246': 'Uttarakhand', '248': 'Uttarakhand', '249': 'Uttarakhand', '263': 'Uttarakhand',
  '403': 'Goa', '605': 'Puducherry', '737': 'Sikkim', '744': 'Andaman and Nicobar',
  '790': 'Arunachal Pradesh', '791': 'Arunachal Pradesh', '792': 'Arunachal Pradesh', '793': 'Meghalaya', '794': 'Meghalaya',
  '795': 'Manipur', '796': 'Mizoram', '797': 'Nagaland', '798': 'Nagaland', '799': 'Tripura',
  '814': 'Jharkhand', '815': 'Jharkhand', '816': 'Jharkhand', '822': 'Jharkhand', '825': 'Jharkhand', '826': 'Jharkhand',
  '827': 'Jharkhand', '828': 'Jharkhand', '829': 'Jharkhand', '831': 'Jharkhand', '832': 'Jharkhand', '833': 'Jharkhand',
  '834': 'Jharkhand', '835': 'Jharkhand',
};

const PIN_2: [number, number, string][] = [
  [11, 11, 'Delhi'], [12, 13, 'Haryana'], [14, 16, 'Punjab'], [17, 17, 'Himachal Pradesh'], [18, 19, 'Jammu and Kashmir'],
  [20, 28, 'Uttar Pradesh'], [30, 34, 'Rajasthan'], [36, 39, 'Gujarat'], [40, 44, 'Maharashtra'], [45, 48, 'Madhya Pradesh'],
  [49, 49, 'Chhattisgarh'], [50, 50, 'Telangana'], [51, 53, 'Andhra Pradesh'], [56, 59, 'Karnataka'], [60, 64, 'Tamil Nadu'],
  [67, 69, 'Kerala'], [70, 74, 'West Bengal'], [75, 77, 'Odisha'], [78, 78, 'Assam'], [80, 85, 'Bihar'],
];

export const stateFromPin = (pin: string) => {
  if (!/^[1-9]\d{5}$/.test(pin)) return '';
  const two = Number(pin.slice(0, 2));
  return PIN_3[pin.slice(0, 3)] ?? PIN_2.find(([a, b]) => two >= a && two <= b)?.[2] ?? '';
};

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar', 'Chandigarh',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry', 'Dadra and Nagar Haveli and Daman and Diu',
];

export const APPS: { name: string; type: 'Social' | 'Finance' | 'Work' | 'Entertainment' | 'Other'; site: string }[] = [
  { name: 'Instagram', type: 'Social', site: 'https://www.instagram.com' },
  { name: 'Facebook', type: 'Social', site: 'https://www.facebook.com' },
  { name: 'WhatsApp', type: 'Social', site: 'https://web.whatsapp.com' },
  { name: 'Snapchat', type: 'Social', site: 'https://www.snapchat.com' },
  { name: 'X (Twitter)', type: 'Social', site: 'https://x.com' },
  { name: 'Telegram', type: 'Social', site: 'https://web.telegram.org' },
  { name: 'Discord', type: 'Social', site: 'https://discord.com' },
  { name: 'Reddit', type: 'Social', site: 'https://www.reddit.com' },
  { name: 'Gmail', type: 'Work', site: 'https://mail.google.com' },
  { name: 'Google', type: 'Work', site: 'https://accounts.google.com' },
  { name: 'Outlook', type: 'Work', site: 'https://outlook.live.com' },
  { name: 'LinkedIn', type: 'Work', site: 'https://www.linkedin.com' },
  { name: 'Naukri', type: 'Work', site: 'https://www.naukri.com' },
  { name: 'Slack', type: 'Work', site: 'https://slack.com' },
  { name: 'Microsoft Teams', type: 'Work', site: 'https://teams.microsoft.com' },
  { name: 'Zoom', type: 'Work', site: 'https://zoom.us' },
  { name: 'YouTube', type: 'Entertainment', site: 'https://www.youtube.com' },
  { name: 'Netflix', type: 'Entertainment', site: 'https://www.netflix.com' },
  { name: 'Prime Video', type: 'Entertainment', site: 'https://www.primevideo.com' },
  { name: 'JioHotstar', type: 'Entertainment', site: 'https://www.hotstar.com' },
  { name: 'Spotify', type: 'Entertainment', site: 'https://open.spotify.com' },
  { name: 'Paytm', type: 'Finance', site: 'https://paytm.com' },
  { name: 'PhonePe', type: 'Finance', site: 'https://www.phonepe.com' },
  { name: 'Google Pay', type: 'Finance', site: 'https://pay.google.com' },
  { name: 'SBI YONO', type: 'Finance', site: 'https://yonosbi.sbi' },
  { name: 'HDFC Bank', type: 'Finance', site: 'https://netbanking.hdfcbank.com' },
  { name: 'ICICI Bank', type: 'Finance', site: 'https://www.icicibank.com' },
  { name: 'Groww', type: 'Finance', site: 'https://groww.in' },
  { name: 'Zerodha Kite', type: 'Finance', site: 'https://kite.zerodha.com' },
  { name: 'Upstox', type: 'Finance', site: 'https://upstox.com' },
  { name: 'Amazon', type: 'Other', site: 'https://www.amazon.in' },
  { name: 'Flipkart', type: 'Other', site: 'https://www.flipkart.com' },
  { name: 'Myntra', type: 'Other', site: 'https://www.myntra.com' },
  { name: 'Swiggy', type: 'Other', site: 'https://www.swiggy.com' },
  { name: 'Zomato', type: 'Other', site: 'https://www.zomato.com' },
  { name: 'Uber', type: 'Other', site: 'https://www.uber.com' },
  { name: 'Ola', type: 'Other', site: 'https://www.olacabs.com' },
  { name: 'IRCTC', type: 'Other', site: 'https://www.irctc.co.in' },
  { name: 'MakeMyTrip', type: 'Other', site: 'https://www.makemytrip.com' },
  { name: 'Wi-Fi', type: 'Other', site: '' },
];

const FINANCE_WORDS = /bank|pay|upi|card|loan|demat|mutual|stock|trade|insurance|wallet|credit|sbi|hdfc|icici|axis|kotak/i;
const SOCIAL_WORDS = /chat|social|gram|book|tweet|snap|dating|tinder/i;
const FUN_WORDS = /tv|movie|music|video|game|play|stream|prime|hotstar|netflix/i;
const WORK_WORDS = /mail|office|work|job|team|jira|git|drive|cloud/i;

export const guessAppType = (name: string) => {
  const known = APPS.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());
  if (known) return known.type;
  if (FINANCE_WORDS.test(name)) return 'Finance';
  if (SOCIAL_WORDS.test(name)) return 'Social';
  if (FUN_WORDS.test(name)) return 'Entertainment';
  if (WORK_WORDS.test(name)) return 'Work';
  return null;
};

export const DOC_RULES: Record<string, { max: number; hint: string; test: RegExp; keyboard: (typed: string) => 'default' | 'number-pad'; format?: (v: string) => string }> = {
  Aadhaar: { max: 14, hint: '12 digits', test: /^\d{12}$/, keyboard: () => 'number-pad', format: (v) => v.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ') },
  PAN: { max: 10, hint: '5 letters, 4 numbers, 1 letter, like ABCDE1234F', test: /^[A-Z]{5}\d{4}[A-Z]$/, keyboard: (t) => (t.length >= 5 && t.length < 9 ? 'number-pad' : 'default') },
  Passport: { max: 8, hint: '1 letter and 7 numbers, like K1234567', test: /^[A-Z]\d{7}$/, keyboard: (t) => (t.length >= 1 ? 'number-pad' : 'default') },
  'Voter ID': { max: 10, hint: '3 letters and 7 numbers, like ABC1234567', test: /^[A-Z]{3}\d{7}$/, keyboard: (t) => (t.length >= 3 ? 'number-pad' : 'default') },
  'Driving Licence': { max: 16, hint: 'Like MH1420110062821', test: /^[A-Z]{2}[0-9A-Z]{11,14}$/, keyboard: (t) => (t.length >= 2 ? 'number-pad' : 'default') },
  'Vehicle RC': { max: 10, hint: 'Vehicle number, like MH12AB1234', test: /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/, keyboard: () => 'default' },
  Insurance: { max: 20, hint: 'Policy number', test: /^[0-9A-Z/-]{4,20}$/, keyboard: () => 'default' },
  Degree: { max: 20, hint: 'Certificate or roll number', test: /^[0-9A-Z/-]{2,20}$/, keyboard: () => 'default' },
  Other: { max: 30, hint: '', test: /^.{1,30}$/, keyboard: () => 'default' },
};

export const lookupPin = async (pin: string): Promise<{ city: string; state: string } | null> => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const office = (await res.json())?.[0]?.PostOffice?.[0];
    return office ? { city: office.District ?? '', state: office.State ?? '' } : null;
  } catch {
    return null;
  }
};
