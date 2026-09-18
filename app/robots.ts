import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/owner', '/api/'],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
