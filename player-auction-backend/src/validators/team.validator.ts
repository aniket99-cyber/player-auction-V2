import Joi from 'joi';

const hexColor = Joi.string().pattern(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);
const objectId = Joi.string().hex().length(24);

export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  shortName: Joi.string().trim().min(2).max(5).required(),
  logoUrl: Joi.string().uri().optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  owner: objectId.required(),
  totalBudget: Joi.number().min(0).required(),
  season: Joi.string().trim().required(),
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  shortName: Joi.string().trim().min(2).max(5).optional(),
  logoUrl: Joi.string().uri().optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  captain: objectId.optional(),
  totalBudget: Joi.number().min(0).optional(),
}).min(1);

export const addRetentionSchema = Joi.object({
  playerId: objectId.required(),
  retentionPrice: Joi.number().min(0).required(),
  retentionOrder: Joi.number().integer().min(1).required(),
});

export const bulkStatusSchema = Joi.object({
  teamIds: Joi.array().items(objectId).min(1).required(),
  isDeleted: Joi.boolean().required(),
});

export const teamIdParamSchema = Joi.object({
  id: objectId.required(),
});
