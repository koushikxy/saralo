const GROUPS: [string, RegExp][] = [
  ['Vegetables and fruits', /onion|tomato|potato|aloo|pyaz|garlic|ginger|chilli|chili|coriander|dhaniya|spinach|palak|carrot|cabbage|cauliflower|gobi|beans|peas|lemon|banana|apple|mango|orange|grape|fruit|vegetable|veggie|cucumber|brinjal|okra|bhindi|capsicum|mint|pudina|methi|papaya|pomegranate|guava|beetroot|radish|mushroom|corn/i],
  ['Milk and eggs', /milk|curd|dahi|paneer|butter|ghee|cheese|egg|cream|yogurt|yoghurt|buttermilk|chaas|lassi/i],
  ['Rice, atta and dal', /rice|atta|flour|dal|daal|sugar|salt|oil|maida|besan|rava|sooji|suji|poha|wheat|masala|turmeric|haldi|jeera|cumin|spice|tea|coffee|chai|rajma|chana|moong|toor|urad|jaggery|gur|mustard|ajwain|hing/i],
  ['Snacks and drinks', /biscuit|chips|namkeen|bread|juice|soda|cold drink|coke|pepsi|chocolate|noodle|maggi|jam|sauce|ketchup|cookie|cake|nuts|almond|cashew|kaju|badam|dry fruit|cornflakes|oats|water bottle/i],
  ['Home and cleaning', /soap|detergent|surf|dish|vim|phenyl|cleaner|tissue|garbage|bulb|battery|broom|mop|harpic|lizol|matchbox|agarbatti|foil|napkin|freshener|bag/i],
  ['Personal care', /shampoo|toothpaste|toothbrush|lotion|razor|sanitary|pad|deo|perfume|face ?wash|moisturi|sunscreen|hair oil|comb|conditioner|cotton|diaper/i],
];

export const GROUP_ORDER = [...GROUPS.map(([name]) => name), 'Other'];

export const groupOf = (item: string) => GROUPS.find(([, test]) => test.test(item))?.[0] ?? 'Other';
