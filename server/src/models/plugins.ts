import { Schema } from "mongoose";

/**
 * Applied to every schema: converts `_id` (ObjectId) into a plain `id`
 * string in JSON output and strips Mongoose's internal `__v` field, so API
 * responses look the same whether a value came straight from the DB or was
 * hand-built in a route.
 */
export function withJSONId(schema: Schema): void {
  schema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret: any) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
  schema.set("toObject", {
    virtuals: true,
    transform(_doc, ret: any) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}
