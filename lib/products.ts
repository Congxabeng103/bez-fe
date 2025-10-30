export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  sizes: string[]
  colors: string[]
  rating: number
  reviews: number
}

export const products: Product[] = [
  {
    id: "1",
    name: "Áo phông trắng cổ điển",
    price: 299000,
    image: "/white-t-shirt.png",
    category: "Áo phông",
    description: "Áo phông trắng thoải mái và linh hoạt, phù hợp cho bất kỳ dịp nào.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Trắng", "Đen", "Xám"],
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    name: "Quần jean ôm sát hiện đại",
    price: 799000,
    image: "/slim-fit-jeans.png",
    category: "Quần jean",
    description: "Quần jean ôm sát hiện đại với vải co giãn thoải mái.",
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: ["Xanh đậm", "Xanh nhạt", "Đen"],
    rating: 4.7,
    reviews: 256,
  },
  {
    id: "3",
    name: "Áo hoodie thoải mái",
    price: 599000,
    image: "/casual-hoodie.jpg",
    category: "Áo hoodie",
    description: "Áo hoodie ấm áp, hoàn hảo cho mặc hàng ngày và các hoạt động ngoài trời.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Xám", "Đen", "Hải quân"],
    rating: 4.6,
    reviews: 189,
  },
  {
    id: "4",
    name: "Váy hè nhẹ nhàng",
    price: 499000,
    image: "/woman-in-floral-summer-dress.png",
    category: "Váy",
    description: "Váy hè nhẹ nhàng và thoáng khí, lý tưởng cho thời tiết ấm.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Hoa", "Trắng", "Xanh"],
    rating: 4.4,
    reviews: 95,
  },
  {
    id: "5",
    name: "Áo khoác da cao cấp",
    price: 1999000,
    image: "/classic-leather-jacket.png",
    category: "Áo khoác",
    description: "Áo khoác da cao cấp cho vẻ ngoài phong cách và tinh tế.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Đen", "Nâu"],
    rating: 4.8,
    reviews: 342,
  },
  {
    id: "6",
    name: "Quần chino đa năng",
    price: 699000,
    image: "/chino-pants.png",
    category: "Quần",
    description: "Quần chino đa năng phù hợp cho cả mặc bình thường lẫn trang trọng.",
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: ["Kaki", "Hải quân", "Xám"],
    rating: 4.5,
    reviews: 167,
  },
  {
    id: "7",
    name: "Áo polo cổ điển",
    price: 449000,
    image: "/classic-polo-shirt.png",
    category: "Áo sơ mi",
    description: "Áo polo cổ điển với kiểu dáng hiện đại và vải cao cấp.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Trắng", "Hải quân", "Đỏ"],
    rating: 4.3,
    reviews: 112,
  },
  {
    id: "8",
    name: "Áo len lông cừu ấm áp",
    price: 899000,
    image: "/cozy-wool-sweater.png",
    category: "Áo len",
    description: "Áo len lông cừu ấm áp và thoải mái, hoàn hảo cho mùa lạnh.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Kem", "Xám", "Hải quân"],
    rating: 4.6,
    reviews: 203,
  },
]
