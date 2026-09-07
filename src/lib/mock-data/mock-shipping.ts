import { ShippingQuoteRequest, ShippingQuoteResponse, ShippingQuoteOption, ShipmentSpecs } from "@/services/shipping.service";
import { calculateTotalCbm } from "@/lib/services/shipping-package";

/**
 * Mock Freight Rates — AIR (ARAMEX) only.
 * Manual shipping (Discuss Shipping Directly) does NOT call this function.
 */
const AIR_RATE_PER_KG = 6.50; // $6.50 USD per kg

/**
 * Generates a realistic Aramex air shipping quote based on order items and destination.
 * Only Aramex air freight is auto-quoted. Manual shipping is handled separately in the UI.
 */
export function calculateMockShippingQuote(request: ShippingQuoteRequest): ShippingQuoteResponse {
  const totalQuantity = request.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  
  // Calculate estimated cartons & weights based on apparel rules of thumb (approx 50 pcs/carton, 0.35kg/pc)
  const cartonCount = Math.max(1, Math.ceil(totalQuantity / 50));
  const cartonLength = 60; // cm
  const cartonWidth = 40;  // cm
  const cartonHeight = 35; // cm
  const totalCbm = calculateTotalCbm(cartonLength, cartonWidth, cartonHeight, cartonCount, "cm");
  
  const estimatedGrossWeight = Math.round((totalQuantity * 0.35 + cartonCount * 1.2) * 10) / 10;
  const estimatedNetWeight = Math.round((totalQuantity * 0.32) * 10) / 10;
  
  // Volumetric weight for Air (L x W x H / 5000 in cm)
  const volumetricWeight = Math.round(((cartonLength * cartonWidth * cartonHeight) / 5000) * cartonCount * 10) / 10;
  const chargeableWeight = Math.max(estimatedGrossWeight, volumetricWeight);

  const shipmentSpecs: ShipmentSpecs = {
    package_quantity: totalQuantity,
    carton_count: cartonCount,
    carton_dimensions: {
      length: cartonLength,
      width: cartonWidth,
      height: cartonHeight,
      unit: "cm",
    },
    gross_weight: estimatedGrossWeight,
    net_weight: estimatedNetWeight,
    weight_unit: "kg",
    cbm: totalCbm,
    total_cbm: totalCbm,
  };

  const airCost = Math.round(chargeableWeight * AIR_RATE_PER_KG * 100) / 100;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const quotes: ShippingQuoteOption[] = [];

  // Aramex Air Quote — the only auto-quoted shipping method
  quotes.push({
    quote_id: `sq_air_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    provider: "aramex",
    carrier: "Aramex Express Air",
    service_name: "Priority Air Express (DDP / Door Delivery)",
    division: "International Express",
    mode: "air",
    amount: airCost,
    currency: "USD",
    estimated_days: "3-5 business days",
    gross_weight: estimatedGrossWeight,
    net_weight: estimatedNetWeight,
    chargeable_weight: chargeableWeight,
    weight_unit: "kg",
    carton_count: cartonCount,
    cbm: totalCbm,
    port_of_loading: "Hazrat Shahjalal International Airport (DAC), Dhaka",
    is_available: true,
    notes: "Direct flight dispatch from Hazrat Shahjalal International Airport (DAC), Dhaka.",
    quoted_at: now.toISOString(),
    expires_at: expiresAt,
  });

  return {
    success: true,
    origin: {
      name: "Ayaan Clothing Export Hub",
      company: "Ayaan Clothing",
      city: "Dhaka",
      country_code: "BD",
    },
    destination: {
      country_code: request.country_code || "US",
      city: request.city || "New York",
      postal_code: request.postal_code || "10001",
      line1: request.address1 || "Commercial Address",
    },
    goods_value: totalQuantity * 18,
    currency: "USD",
    shipment_specs: shipmentSpecs,
    quotes,
  };
}
