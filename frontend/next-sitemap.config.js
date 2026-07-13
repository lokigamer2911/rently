module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_CLIENT_URL || 'https://rently-demo.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/admin', '/admin/*'],
};
