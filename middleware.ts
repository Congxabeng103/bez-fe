// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode'; // Cài đặt: npm install jwt-decode

// Định nghĩa cấu trúc payload trong JWT của bạn (thêm các trường cần thiết)
interface JwtPayload {
  sub: string; // Subject (thường là email hoặc user id)
  role: 'USER' | 'ADMIN' | 'STAFF'; // Vai trò
  iat: number; // Issued at
  exp: number; // Expiration time
  // Thêm các trường khác nếu có, ví dụ: name
}

// Các đường dẫn admin cần bảo vệ
const adminPaths = ['/dashboard', '/products', '/orders', '/customers', '/employees', '/variants']; // Thêm các path admin khác

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value; // Lấy token từ cookie (đặt tên cookie khớp với lúc bạn lưu)
  const { pathname } = request.nextUrl;

  // --- 1. Xử lý Chưa đăng nhập ---
  if (!token) {
    // Nếu chưa đăng nhập VÀ đang cố truy cập trang admin -> về trang login
    if (adminPaths.some(path => pathname.startsWith(path))) {
      console.log('Middleware: Not logged in, accessing admin path -> redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Nếu chưa đăng nhập và truy cập trang user -> cho phép (hoặc về login nếu cần)
    console.log('Middleware: Not logged in, accessing user path -> allowing');
    return NextResponse.next(); // Cho phép truy cập trang user/login
  }

  // --- 2. Xử lý Đã đăng nhập ---
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const userRole = decoded.role;
    const isTokenExpired = Date.now() >= decoded.exp * 1000;

    if (isTokenExpired) {
      console.log('Middleware: Token expired -> redirecting to login');
       // Xóa cookie cũ (tùy chọn)
       const response = NextResponse.redirect(new URL('/login', request.url));
       response.cookies.delete('authToken');
       return response;
    }

    console.log('Middleware: Logged in, Role:', userRole, 'Path:', pathname);

    // --- Logic điều hướng theo Role ---
    if (userRole === 'USER') {
      // Nếu là USER cố vào trang admin -> Đá về trang chủ user
      if (adminPaths.some(path => pathname.startsWith(path))) {
         console.log('Middleware: USER accessing admin path -> redirecting to user home');
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Ngược lại (USER vào trang user) -> Cho phép
      console.log('Middleware: USER accessing user path -> allowing');
      return NextResponse.next();
    }

    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      // Nếu là ADMIN/STAFF vào trang user (ví dụ trang chủ '/')
      // -> Tự động chuyển hướng đến trang dashboard admin
      // (Loại trừ các API routes nếu có)
      if (pathname === '/' && !pathname.startsWith('/api')) { // Chỉ chuyển hướng từ trang chủ user
         console.log('Middleware: ADMIN/STAFF accessing user home -> redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Ngược lại (ADMIN/STAFF vào trang admin hoặc các trang user khác) -> Cho phép
       console.log('Middleware: ADMIN/STAFF accessing allowed path -> allowing');
      return NextResponse.next();
    }

    // Trường hợp role không xác định (dự phòng)
    console.log('Middleware: Unknown role -> redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));

  } catch (error) {
    // Token lỗi, giải mã thất bại -> về trang login
    console.error('Middleware: Error decoding token -> redirecting to login', error);
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
     * - login (trang login)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};