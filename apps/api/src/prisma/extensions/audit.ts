import { Prisma } from '@opencode/database';

let currentUserId: string | undefined;

export function setCurrentUserId(id: string | undefined) {
  currentUserId = id;
}

export function auditExtension() {
  return Prisma.defineExtension({
    name: 'audit',
    query: {
      $allModels: {
        async create({ args, query }) {
          if (currentUserId && args.data) {
            if (typeof args.data === 'object' && !Array.isArray(args.data)) {
              args.data = {
                ...args.data,
                createdById: (args.data as any).createdById ?? currentUserId,
                updatedById: (args.data as any).updatedById ?? currentUserId,
              };
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          if (currentUserId && args.data) {
            if (typeof args.data === 'object' && !Array.isArray(args.data)) {
              args.data = {
                ...args.data,
                updatedById: currentUserId,
              };
            }
          }
          return query(args);
        },
      },
    },
  });
}
