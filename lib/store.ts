import { create } from "zustand"

export interface User {
  id: string
  email: string
  password: string
  name: string
  phone: string
  avatar: string
}

export interface Product {
  id: string
  name: string
  description: string
  image: string
  category: string
  createdAt: string
}

export interface AttributeValue {
  id: string
  attributeId: string
  value: string
}

export interface Attribute {
  id: string
  name: string
  values: AttributeValue[]
}

export interface Variant {
  id: string
  productId: string
  productName: string
  attributes: Record<string, string>
  sku: string
  price: number
  stock: number
  image: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  items: number
}

export interface Promotion {
  id: string
  code: string
  type: "discount" | "campaign"
  value: number
  description: string
  startDate: string
  endDate: string
  active: boolean
}

export interface PromotionCampaign {
  id: string
  name: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  productIds: string[]
  active: boolean
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  joinDate: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  joinDate: string
}

export interface Activity {
  id: string
  employeeId: string
  employeeName: string
  action: string
  orderId: string
  timestamp: string
}

interface Store {
  currentUser: User | null
  users: User[]
  products: Product[]
  attributes: Attribute[]
  variants: Variant[]
  orders: Order[]
  promotions: Promotion[]
  campaigns: PromotionCampaign[]
  customers: Customer[]
  employees: Employee[]
  activities: Activity[]

  login: (email: string, password: string) => boolean
  register: (email: string, password: string, name: string) => boolean
  logout: () => void
  updateUserProfile: (user: Partial<User>) => void
  changePassword: (oldPassword: string, newPassword: string) => boolean
  resetPassword: (email: string) => boolean

  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void

  addAttribute: (attribute: Attribute) => void
  updateAttribute: (id: string, attribute: Partial<Attribute>) => void
  deleteAttribute: (id: string) => void
  addAttributeValue: (attributeId: string, value: AttributeValue) => void
  deleteAttributeValue: (attributeId: string, valueId: string) => void

  addVariant: (variant: Variant) => void
  updateVariant: (id: string, variant: Partial<Variant>) => void
  deleteVariant: (id: string) => void
  deleteVariantsByProduct: (productId: string) => void

  updateOrderStatus: (id: string, status: Order["status"]) => void
  deleteOrder: (id: string) => void

  addPromotion: (promotion: Promotion) => void
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void
  deletePromotion: (id: string) => void

  addCampaign: (campaign: PromotionCampaign) => void
  updateCampaign: (id: string, campaign: Partial<PromotionCampaign>) => void
  deleteCampaign: (id: string) => void

  addActivity: (activity: Activity) => void
  deleteActivity: (id: string) => void

  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
}

const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    password: "admin123",
    name: "Nguyễn Quản Trị",
    phone: "0901234567",
    avatar: "/admin-avatar.png",
  },
]

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Áo thun trắng",
    description: "Áo thun cotton 100% chất lượng cao",
    image: "/white-tshirt.png",
    category: "Áo",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Quần jean xanh",
    description: "Quần jean denim cao cấp",
    image: "/blue-jeans.jpg",
    category: "Quần",
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    name: "Áo sơ mi đen",
    description: "Áo sơ mi linen thoáng mát",
    image: "/black-shirt.jpg",
    category: "Áo",
    createdAt: "2024-01-17",
  },
]

const mockAttributes: Attribute[] = [
  {
    id: "1",
    name: "Kích cỡ",
    values: [
      { id: "1-1", attributeId: "1", value: "XS" },
      { id: "1-2", attributeId: "1", value: "S" },
      { id: "1-3", attributeId: "1", value: "M" },
      { id: "1-4", attributeId: "1", value: "L" },
      { id: "1-5", attributeId: "1", value: "XL" },
      { id: "1-6", attributeId: "1", value: "XXL" },
    ],
  },
  {
    id: "2",
    name: "Màu sắc",
    values: [
      { id: "2-1", attributeId: "2", value: "Trắng" },
      { id: "2-2", attributeId: "2", value: "Đen" },
      { id: "2-3", attributeId: "2", value: "Xanh" },
      { id: "2-4", attributeId: "2", value: "Đỏ" },
      { id: "2-5", attributeId: "2", value: "Xám" },
    ],
  },
  {
    id: "3",
    name: "Chất liệu",
    values: [
      { id: "3-1", attributeId: "3", value: "Cotton" },
      { id: "3-2", attributeId: "3", value: "Linen" },
      { id: "3-3", attributeId: "3", value: "Polyester" },
      { id: "3-4", attributeId: "3", value: "Blend" },
    ],
  },
]

const mockVariants: Variant[] = [
  {
    id: "1",
    productId: "1",
    productName: "Áo thun trắng",
    attributes: { "Kích cỡ": "S", "Màu sắc": "Trắng", "Chất liệu": "Cotton" },
    sku: "AO001-S-W-C",
    price: 150000,
    stock: 20,
    image: "/white-tshirt-s.jpg",
  },
  {
    id: "2",
    productId: "1",
    productName: "Áo thun trắng",
    attributes: { "Kích cỡ": "M", "Màu sắc": "Trắng", "Chất liệu": "Cotton" },
    sku: "AO001-M-W-C",
    price: 150000,
    stock: 15,
    image: "/white-tshirt-m.jpg",
  },
  {
    id: "3",
    productId: "1",
    productName: "Áo thun trắng",
    attributes: { "Kích cỡ": "L", "Màu sắc": "Đen", "Chất liệu": "Cotton" },
    sku: "AO001-L-B-C",
    price: 150000,
    stock: 10,
    image: "/black-tshirt-l.jpg",
  },
]

const mockOrders: Order[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  orderNumber: `ORD-${String(i + 1).padStart(5, "0")}`,
  customerName: ["Nguyễn Văn A", "Trần Thị B", "Phạm Văn C", "Hoàng Thị D"][i % 4],
  total: Math.floor(Math.random() * 5000000) + 500000,
  status: ["pending", "processing", "shipped", "delivered", "cancelled"][i % 5] as any,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  items: Math.floor(Math.random() * 5) + 1,
}))

const mockPromotions: Promotion[] = [
  {
    id: "1",
    code: "SUMMER2024",
    type: "discount",
    value: 20,
    description: "Giảm 20% cho mùa hè",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    active: true,
  },
  {
    id: "2",
    code: "WELCOME10",
    type: "discount",
    value: 10,
    description: "Giảm 10% cho khách hàng mới",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    active: true,
  },
]

const mockCampaigns: PromotionCampaign[] = [
  {
    id: "1",
    name: "Khuyến mãi mùa hè",
    description: "Giảm giá cho các sản phẩm mùa hè",
    discountType: "percentage",
    discountValue: 20,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    productIds: ["1", "2"],
    active: true,
    createdAt: "2024-05-01",
  },
]

const mockCustomers: Customer[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  name: `Khách hàng ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  phone: `090${String(i).padStart(7, "0")}`,
  totalOrders: Math.floor(Math.random() * 20) + 1,
  totalSpent: Math.floor(Math.random() * 50000000) + 1000000,
  joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
}))

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Nguyễn Quản Trị",
    email: "admin@example.com",
    phone: "0901234567",
    position: "Quản trị viên",
    department: "Quản lý",
    joinDate: "2023-01-01",
  },
  {
    id: "2",
    name: "Trần Bán Hàng",
    email: "sales@example.com",
    phone: "0902345678",
    position: "Nhân viên bán hàng",
    department: "Bán hàng",
    joinDate: "2023-06-15",
  },
  {
    id: "3",
    name: "Phạm Kho",
    email: "warehouse@example.com",
    phone: "0903456789",
    position: "Nhân viên kho",
    department: "Kho",
    joinDate: "2023-03-20",
  },
]

const mockActivities: Activity[] = [
  {
    id: "1",
    employeeId: "2",
    employeeName: "Trần Bán Hàng",
    action: "Cập nhật trạng thái đơn hàng",
    orderId: "ORD-00001",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    employeeId: "3",
    employeeName: "Phạm Kho",
    action: "Xác nhận gửi hàng",
    orderId: "ORD-00002",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    employeeId: "2",
    employeeName: "Trần Bán Hàng",
    action: "Hủy đơn hàng",
    orderId: "ORD-00003",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    employeeId: "3",
    employeeName: "Phạm Kho",
    action: "Cập nhật tồn kho",
    orderId: "ORD-00004",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

export const useStore = create<Store>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  products: mockProducts,
  attributes: mockAttributes,
  variants: mockVariants,
  orders: mockOrders,
  promotions: mockPromotions,
  campaigns: mockCampaigns,
  customers: mockCustomers,
  employees: mockEmployees,
  activities: mockActivities,

  login: (email, password) => {
    const user = get().users.find((u) => u.email === email && u.password === password)
    if (user) {
      set({ currentUser: user })
      return true
    }
    return false
  },

  register: (email, password, name) => {
    const existingUser = get().users.find((u) => u.email === email)
    if (existingUser) return false

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      phone: "",
      avatar: "/diverse-user-avatars.png",
    }
    set((state) => ({ users: [...state.users, newUser], currentUser: newUser }))
    return true
  },

  logout: () => set({ currentUser: null }),

  updateUserProfile: (user) => {
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...user } : null,
      users: state.users.map((u) => (u.id === state.currentUser?.id ? { ...u, ...user } : u)),
    }))
  },

  changePassword: (oldPassword, newPassword) => {
    const user = get().currentUser
    if (!user || user.password !== oldPassword) return false
    get().updateUserProfile({ password: newPassword })
    return true
  },

  resetPassword: (email) => {
    const user = get().users.find((u) => u.email === email)
    if (!user) return false
    const newPassword = Math.random().toString(36).slice(-8)
    set((state) => ({
      users: state.users.map((u) => (u.email === email ? { ...u, password: newPassword } : u)),
    }))
    return true
  },

  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
    })),

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      variants: state.variants.filter((v) => v.productId !== id),
    })),

  addAttribute: (attribute) =>
    set((state) => ({
      attributes: [...state.attributes, attribute],
    })),

  updateAttribute: (id, attribute) =>
    set((state) => ({
      attributes: state.attributes.map((a) => (a.id === id ? { ...a, ...attribute } : a)),
    })),

  deleteAttribute: (id) =>
    set((state) => ({
      attributes: state.attributes.filter((a) => a.id !== id),
    })),

  addAttributeValue: (attributeId, value) =>
    set((state) => ({
      attributes: state.attributes.map((a) => (a.id === attributeId ? { ...a, values: [...a.values, value] } : a)),
    })),

  deleteAttributeValue: (attributeId, valueId) =>
    set((state) => ({
      attributes: state.attributes.map((a) =>
        a.id === attributeId ? { ...a, values: a.values.filter((v) => v.id !== valueId) } : a,
      ),
    })),

  addVariant: (variant) =>
    set((state) => ({
      variants: [...state.variants, variant],
    })),

  updateVariant: (id, variant) =>
    set((state) => ({
      variants: state.variants.map((v) => (v.id === id ? { ...v, ...variant } : v)),
    })),

  deleteVariant: (id) =>
    set((state) => ({
      variants: state.variants.filter((v) => v.id !== id),
    })),

  deleteVariantsByProduct: (productId) =>
    set((state) => ({
      variants: state.variants.filter((v) => v.productId !== productId),
    })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),

  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),

  addPromotion: (promotion) =>
    set((state) => ({
      promotions: [...state.promotions, promotion],
    })),

  updatePromotion: (id, promotion) =>
    set((state) => ({
      promotions: state.promotions.map((p) => (p.id === id ? { ...p, ...promotion } : p)),
    })),

  deletePromotion: (id) =>
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
    })),

  addCampaign: (campaign) =>
    set((state) => ({
      campaigns: [...state.campaigns, campaign],
    })),

  updateCampaign: (id, campaign) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...campaign } : c)),
    })),

  deleteCampaign: (id) =>
    set((state) => ({
      campaigns: state.campaigns.filter((c) => c.id !== id),
    })),

  addActivity: (activity) =>
    set((state) => ({
      activities: [...state.activities, activity],
    })),

  deleteActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    })),

  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),

  updateCustomer: (id, customer) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
    })),

  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),

  addEmployee: (employee) =>
    set((state) => ({
      employees: [...state.employees, employee],
    })),

  updateEmployee: (id, employee) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...employee } : e)),
    })),

  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    })),
}))
