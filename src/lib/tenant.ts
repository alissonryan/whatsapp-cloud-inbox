import { prisma } from '@/lib/db';

export async function getOrCreateDefaultTenant() {
  const slug = 'default';

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }

  return prisma.tenant.create({
    data: {
      slug,
      name: 'Default'
    }
  });
}

