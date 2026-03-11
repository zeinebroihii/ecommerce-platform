export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  responsibility: string;
  companyName: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  status: 'New' | 'Qualified' | 'Converted';
  score: number;
}

export interface Product {
  id: string;
  name: string;
  productCode: string;
  description: string;
  family: string;
  category?: string;
  subcategory?: string;
  price: number;
  stockLevel: number;
  recommendedStock: number;
  status: 'En stock' | 'En arrivage' | 'Epuisé' | 'Sur commande 48h' | 'In Stock' | 'Low Stock' | 'Critical';
  brand?: string;
  warranty?: string;
  image: string;
  isActive: boolean;
  unitOfMeasure: string;
  rating?: number;
  reviews?: number;
  features?: string[];
  isNew?: boolean;
  isPopular?: boolean;
  specs?: Record<string, string>;
  colors?: { name: string; hex: string; image: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface QuoteMessage {
  id: string;
  sender: 'user' | 'rep';
  text: string;
  time: string;
}

export interface QuoteVersion {
  version: number;
  date: string;
  total: number;
  status: string;
  products: CartItem[];
}

export interface Quote {
  id: string;
  date: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Negotiation' | 'Accepted' | 'Signed';
  probability: number;
  currentVersion: number;
  versions: QuoteVersion[];
  messages: QuoteMessage[];
  contractStatus?: 'Not Generated' | 'Pending Signature' | 'Signed';
  contractUrl?: string;
}

export interface ComponentExample {
  id: string;
  name: string;
  description: string;
  reactCode: string;
  lwcHtml: string;
  lwcJs: string;
  lwcXml: string;
  lwcCss: string;
  render: () => React.ReactNode;
}
