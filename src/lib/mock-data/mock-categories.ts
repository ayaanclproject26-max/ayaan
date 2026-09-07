import { CategoryModel } from "@/services/category.service";

/**
 * Baseline Mock Categories
 * Preserves the 3-dimensional taxonomy:
 * 1. Audience (MEN, WOMEN, BOYS, GIRLS, UNISEX)
 * 2. Product Categories (Sweaters, T-Shirts, Hoodies, Trousers, Pants, Shorts, Shirts, Polo Shirts, Jackets, Activewear, etc.)
 *
 * NOTE: The Girls image (https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800)
 * is strictly preserved per project specification.
 */
export const INITIAL_MOCK_CATEGORIES: CategoryModel[] = [

  // Expanded Product Categories
  {
    id: "c_sweaters",
    name: "Sweaters",
    slug: "sweaters",
    image_url: "https://images.pexels.com/photos/15694151/pexels-photo-15694151.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/15694151/pexels-photo-15694151.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Premium wool, cashmere blend, and cotton crewneck sweaters.",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "c_tshirts",
    name: "T-Shirts",
    slug: "t-shirts",
    image_url: "https://images.pexels.com/photos/7658459/pexels-photo-7658459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/7658459/pexels-photo-7658459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "100% Combed cotton, heavyweight jersey, and graphic tees.",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "c_hoodies",
    name: "Hoodies",
    slug: "hoodies",
    image_url: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Brushed fleece pullover and zip-up hoodies with kangaroo pockets.",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "c_trousers",
    name: "Trousers",
    slug: "trousers",
    image_url: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Tailored chinos, pleated dress trousers, and relaxed fit slacks.",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "c_pants",
    name: "Pants",
    slug: "pants",
    image_url: "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Heavyweight denim jeans, cargo pants, and utility workwear.",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "c_shorts",
    name: "Shorts",
    slug: "shorts",
    image_url: "https://images.pexels.com/photos/16022099/pexels-photo-16022099.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/16022099/pexels-photo-16022099.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "French terry sweatshorts, twill walking shorts, and active shorts.",
    sort_order: 6,
    is_active: true,
  },
  {
    id: "c_jackets",
    name: "Jackets",
    slug: "jackets",
    image_url: "https://images.pexels.com/photos/19490409/pexels-photo-19490409.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/19490409/pexels-photo-19490409.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Denim trucker jackets, bomber jackets, and winter outerwear.",
    sort_order: 7,
    is_active: true,
  },
  {
    id: "c_polos",
    name: "Polo Shirts",
    slug: "polo-shirts",
    image_url: "https://images.pexels.com/photos/8217415/pexels-photo-8217415.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/8217415/pexels-photo-8217415.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Piqué cotton athletic polos with ribbed collars and pearl buttons.",
    sort_order: 8,
    is_active: true,
  },
  {
    id: "c_activewear",
    name: "Activewear",
    slug: "activewear",
    image_url: "https://images.pexels.com/photos/37451174/pexels-photo-37451174.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/37451174/pexels-photo-37451174.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Moisture-wicking dry-fit performance apparel and gym sets.",
    sort_order: 9,
    is_active: true,
  },
  {
    id: "c_knitwear",
    name: "Knitwear",
    slug: "knitwear",
    image_url: "https://images.pexels.com/photos/35145462/pexels-photo-35145462.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    image: "https://images.pexels.com/photos/35145462/pexels-photo-35145462.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Fine gauge knit cardigans, vests, and structured knit tops.",
    sort_order: 10,
    is_active: true,
  },
];
