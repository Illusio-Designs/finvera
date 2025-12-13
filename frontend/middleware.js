import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = getSubdomain(hostname);
  
  console.log(`[Middleware] Host: ${hostname}, Subdomain: ${subdomain}, Path: ${url.pathname}`);

  // Skip if already on correct path to prevent loops
  if (url.pathname.startsWith('/_next') || 
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Admin subdomain
  if (subdomain === 'admin') {
    // If not already on admin path, redirect
    if (!url.pathname.startsWith('/admin')) {
      // Redirect /login to /admin/login, / to /admin/dashboard
      if (url.pathname === '/login') {
        url.pathname = '/admin/login';
      } else if (url.pathname === '/' || url.pathname === '') {
        url.pathname = '/admin/dashboard';
      } else {
        url.pathname = `/admin${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }
  
  // Client subdomain
  else if (subdomain === 'client') {
    // If not already on client path, redirect
    if (!url.pathname.startsWith('/client')) {
      // Redirect /login to /client/login, / to /client/dashboard
      if (url.pathname === '/login') {
        url.pathname = '/client/login';
      } else if (url.pathname === '/' || url.pathname === '') {
        url.pathname = '/client/dashboard';
      } else {
        url.pathname = `/client${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }
  
  // Main domain (www or root)
  else {
    // Block direct access to admin/client paths on main domain
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/client')) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - admin.finvera.com -> admin
 * - client.finvera.com -> client
 * - www.finvera.com -> www
 * - finvera.com -> null
 * - localhost:3000 -> null
 * - admin.localhost:3000 -> admin (for local dev)
 */
function getSubdomain(hostname) {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // For localhost development (e.g., admin.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }
  
  // For production (e.g., admin.finvera.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore www as subdomain
    if (subdomain === 'www') {
      return null;
    }
    return subdomain;
  }
  
  // No subdomain (e.g., finvera.com or localhost)
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
