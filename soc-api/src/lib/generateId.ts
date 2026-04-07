import prisma from './prisma';

const PREFIX_MAP: Record<string, string> = {
  incident: 'INC',
  alert: 'ALT',
  ticket: 'TKT',
};

export async function generateId(type: string = 'incident') {
  const prefix = PREFIX_MAP[type] || type.toUpperCase().slice(0, 3);
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const seq = await prisma.idSequence.upsert({
    where: { prefix },
    update: { current: { increment: 1 } },
    create: { prefix, current: 1 },
  });

  const seqStr = seq.current.toString().padStart(4, '0');
  return {
    id: `${prefix}-${dateStr}-${seqStr}`,
    prefix,
    sequence: seq.current,
    timestamp: now.toISOString(),
  };
}