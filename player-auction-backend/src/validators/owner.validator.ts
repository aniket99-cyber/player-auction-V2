import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const createOwnerSchema = Joi.object({
  team: objectId.required(),
  name: Joi.string().trim().min(2).max(100).required(),
  imageUrl: Joi.string().uri().optional(),
});

export const updateOwnerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  imageUrl: Joi.string().uri().optional(),
}).min(1);
