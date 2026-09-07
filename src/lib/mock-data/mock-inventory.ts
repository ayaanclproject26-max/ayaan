import { InventoryRecord, Warehouse } from "@/services/admin/inventory.service";

export const INITIAL_MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: 1,
    name: "Dhaka Central Export Hub",
    code: "WH-DHK-01",
    address: "House #33, Road #12, Sector #11, Uttara",
    city: "Dhaka",
    country_code: "BD",
    is_active: true,
    inventories_count: 85,
  },
  {
    id: 2,
    name: "Chittagong Port Export Facility",
    code: "WH-CTG-02",
    address: "Export Processing Zone (EPZ), Agrabad",
    city: "Chittagong",
    country_code: "BD",
    is_active: true,
    inventories_count: 42,
  },
];

export const INITIAL_MOCK_INVENTORY: InventoryRecord[] = [
  {
    id: 1,
    product_variant_id: 101,
    warehouse_id: 1,
    quantity: 1250,
    reserved_quantity: 150,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-08-30T14:30:00Z",
    variant: {
      id: 101,
      sku: "LEVIS-TSH-BLK-M",
      title: "Essential Cotton T-Shirt - Black / M",
      size: "M",
      color: "Black",
      stock: 1250,
      product: {
        id: 1,
        name: "Essential Cotton T-Shirt",
        slug: "essential-cotton-t-shirt",
        sku: "LEVIS-TSH-M-BLK-M-PRD0001",
        wholesale_price: 10.0,
      },
    },
    warehouse: {
      id: 1,
      name: "Dhaka Central Export Hub",
      code: "WH-DHK-01",
    },
    adjustments: [
      {
        id: 1,
        previous_quantity: 1000,
        adjustment_amount: 250,
        resulting_quantity: 1250,
        reason: "New export production batch received from sewing line",
        created_at: "2026-08-28T10:00:00Z",
        admin_user: {
          id: 1,
          name: "Ayaan Admin",
          email: "admin@ayaanclothing.com",
        },
      },
    ],
  },
  {
    id: 2,
    product_variant_id: 102,
    warehouse_id: 1,
    quantity: 800,
    reserved_quantity: 100,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-08-30T14:30:00Z",
    variant: {
      id: 102,
      sku: "ADI-HD-GRY-L",
      title: "Heritage Crewneck Sweatshirt - Grey / L",
      size: "L",
      color: "Grey",
      stock: 800,
      product: {
        id: 2,
        name: "Heritage Crewneck Sweatshirt",
        slug: "heritage-crewneck-sweatshirt",
        sku: "ADI-HD-002",
        wholesale_price: 19.5,
      },
    },
    warehouse: {
      id: 1,
      name: "Dhaka Central Export Hub",
      code: "WH-DHK-01",
    },
    adjustments: [],
  },
];
