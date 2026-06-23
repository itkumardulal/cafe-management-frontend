export type PrintableMenuItem = {
  name: string;
  sellPricePerUnit: string;
  itemType?: string | null;
  unitType?: string | null;
  unitQuantity?: string | null;
  isSpecial: boolean;
};

export type PrintableMenuData = {
  cafe: {
    cafeName: string;
    logo: string | null;
    address: string | null;
    contactNumber: string | null;
    slug: string;
  };
  specials: PrintableMenuItem[];
  categories: Array<{
    id: string;
    name: string;
    sortOrder: number;
    items: PrintableMenuItem[];
  }>;
  generatedAt: string;
};
