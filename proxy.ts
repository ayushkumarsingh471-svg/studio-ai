import { clerkMiddleware } from "@clerk/nextjs/server";

// Default middleware jo sabko andar aane dega, security dashboard khud sambhalega
export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};