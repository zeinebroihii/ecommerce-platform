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
  price: number;
  stockLevel: number;
  recommendedStock: number;
  status: 'In Stock' | 'Low Stock' | 'Critical';
  image: string;
  isActive: boolean;
  unitOfMeasure: string;
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
