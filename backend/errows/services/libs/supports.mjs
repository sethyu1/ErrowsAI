import { Support } from "@errows/models";

export const actions = {
  support_create: {
    params: {
      email: { type: 'email' },
      type: { type: 'string' },
      description: { type: 'string' },
    },
    async handler(ctx) {
      const { email, type, description } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const support = await Support.createSupport(
        client, schema, { email, type, description }
      );

      ctx.meta.$statusCode = 201;
      return support;
    }
  },

  support_list: {
    rest: 'GET /supports',
    params: {
      limit: { type: 'number', optional: true, default: 20, convert: true },
      offset: { type: 'number', optional: true, default: 0, convert: true },
      page: { type: 'number', optional: true, convert: true },
      size: { type: 'number', optional: true, convert: true },
    },
    async handler(ctx) {
      let { limit, offset, page, size } = ctx.params;
      // Allow console-style page/size (page 0-based)
      if (typeof page === 'number' && typeof size === 'number') {
        limit = size;
        offset = page * size;
      }
      const schema = this.buildSchema();
      const client = this.pool;

      const result = await Support.listSupports(
        client, schema, { limit, offset }
      );

      return result;
    }
  },
};
