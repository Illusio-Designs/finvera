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
      url.pathname.startsWith('/static') ||
      url.pathname.startsWith('/favicon') ||
      url.pathname.startsWith('/fonts') ||
      url.pathname.match(/\.(otf|ttf|woff|woff2|eot)$/i)) {
    return NextResponse.next();
  }

  // Admin subdomain
  if (subdomain === 'admin') {
    // If not already on admin path, redirect
    if (!url.pathname.startsWith('/admin')) {
      // Redirect /login to /admin/login, / to /admin/dashboard
      if (url.pathname === '/login' || url.pathname === '/admin/login') {
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
    // If not already on client path, rewrite
    if (!url.pathname.startsWith('/client')) {
      // Handle specific routes
      if (url.pathname === '/login') {
        url.pathname = '/client/login';
      } else if (url.pathname === '/register') {
        url.pathname = '/client/register';
      } else if (url.pathname === '/forgot-password') {
        url.pathname = '/client/forgot-password';
      } else if (url.pathname === '/reset-password') {
        url.pathname = '/client/reset-password';
      } else if (url.pathname === '/pricing') {
        // Use the plain pricing page for client subdomain
        url.pathname = '/plans';
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
 * - admin.finvera.solutions -> admin
 * - client.finvera.solutions -> client
 * - www.finvera.solutions -> www
 * - finvera.solutions -> null
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
  
  // For production (e.g., admin.finvera.solutions, client.finvera.solutions)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore www as subdomain
    if (subdomain === 'www') {
      return null;
    }
    return subdomain;
  }
  
  // No subdomain (e.g., finvera.solutions or localhost)
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|fonts|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.gif|.*\\.otf|.*\\.ttf|.*\\.woff|.*\\.woff2|.*\\.eot).*)',
  ],
};
