import { SchemaOptions } from 'mongoose';

/**
 * Every API response must expose `id` (string) instead of the raw `_id`
 * ObjectId — the entire frontend is written against `.id`. Mongoose's `id`
 * virtual only appears in serialized output when a schema explicitly opts
 * in via `toJSON`/`toObject` transforms (it is NOT on by default, and a
 * global `mongoose.plugin()` can't reliably run before these schemas are
 * compiled given the app's import order) — so every schema spreads this in.
 */
function stripInternalFields(_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = ret;
  return rest;
}

export const idTransformOptions: Pick<SchemaOptions, 'toJSON' | 'toObject'> = {
  toJSON: {
    virtuals: true,
    transform: stripInternalFields,
  },
  toObject: {
    virtuals: true,
    transform: stripInternalFields,
  },
};
