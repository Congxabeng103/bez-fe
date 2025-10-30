import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode'; // (npm install jwt-decode)

// --- 1. SỬA LỖI: Dùng 'roles: string[]' (Mảng) ---
interface JwtPayload {
  sub: string; 
  roles: string[]; // Sửa: Đây là một mảng (vd: ["ADMIN"])
  iat: number;
  exp: number; 
}

// --- 2. SỬA LỖI: Chỉ cần bảo vệ 1 đường dẫn /admin ---
const adminPath = '/admin'; // Tất cả các trang admin đều bắt đầu bằng /admin

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value; // (Tên cookie của bạn)
  const { pathname } = request.nextUrl; // (vd: /admin/products)

  // --- 1. Xử lý Chưa đăng nhập ---
  if (!token) {
    // Nếu chưa đăng nhập VÀ đang cố truy cập trang admin -> về trang login
    if (pathname.startsWith(adminPath)) { // Sửa: Dùng startsWith
      console.log('Middleware: Not logged in, accessing admin path -> redirecting to login');
      // Thêm ?redirect=... để quay lại sau khi login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); 
      return NextResponse.redirect(loginUrl);
    }
    // Nếu chưa đăng nhập và truy cập trang user (/, /products, /login) -> Cho phép
    return NextResponse.next(); 
  }

  // --- 2. Xử lý Đã đăng nhập ---
  try {
    // --- 3. SỬA LỖI: Đọc 'roles' (mảng) ---
    const decoded = jwtDecode<JwtPayload>(token);
    const userRoles = decoded.roles || []; // Sửa: Lấy mảng roles
    const isTokenExpired = Date.now() >= decoded.exp * 1000;

    if (isTokenExpired) {
      console.log('Middleware: Token expired -> redirecting to login');
       const response = NextResponse.redirect(new URL('/login', request.url));
       response.cookies.delete('authToken');
       return response;
    }
    // --- KẾT THÚC SỬA 3 ---

    console.log('Middleware: Logged in, Roles:', userRoles, 'Path:', pathname);

    // --- 4. SỬA LOGIC: Dùng .includes() ---
    if (userRoles.includes('USER')) {
      // Nếu là USER cố vào trang admin -> Đá về trang chủ user
      if (pathname.startsWith(adminPath)) {
         console.log('Middleware: USER accessing admin path -> redirecting to user home');
        return NextResponse.redirect(new URL('/', request.url));
      }
      // USER vào trang user (/, /products) -> Cho phép
      return NextResponse.next();
    }

    if (userRoles.includes('ADMIN') || userRoles.includes('STAFF')) {
      // ADMIN/STAFF vào trang admin (vd: /admin/products) -> Cho phép
      if (pathname.startsWith(adminPath)) {
          return NextResponse.next();
      }
      // ADMIN/STAFF vào các trang public khác (/, /products) -> Cũng cho phép
      return NextResponse.next();
    }
    // --- KẾT THÚC SỬA 4 ---

    // (Role không xác định)
    console.log('Middleware: Unknown role -> redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));

  } catch (error) {
    // Token lỗi, giải mã thất bại -> về trang login
    console.error('Middleware: Error decoding token -> redirecting to login');
     const response = NextResponse.redirect(new URL('/login', request.url));
     response.cookies.delete('authToken'); // Xóa token lỗi
     return response;
  }
}

// --- Cấu hình Matcher ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Các trang auth public (login, register, v.v.)
     */
    // Sửa: Thêm các trang public vào (?!...)
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|activate|reset-password).*)',
  ],
};