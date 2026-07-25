import Joi from 'joi';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';

const objectId = Joi.string().hex().length(24);

const statsSchema = Joi.object({
  appearances: Joi.number().min(0).optional(),
  goals: Joi.number().min(0).optional(),
  assists: Joi.number().min(0).optional(),
});

export const createPlayerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  role: Joi.string()
    .valid(...Object.values(PlayerRole))
    .required(),
  country: Joi.string().trim().min(2).max(100).required(),
  passingYear: Joi.number().integer().min(1950).max(2100).required(),
  age: Joi.number().integer().min(14).max(60).optional(),
  previousTeam: Joi.string().trim().max(100).optional(),
  basePrice: Joi.number().min(0).required(),
  imageUrl: Joi.string().uri().optional(),
  stats: statsSchema.optional(),
});

export const updatePlayerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  role: Joi.string()
    .valid(...Object.values(PlayerRole))
    .optional(),
  country: Joi.string().trim().min(2).max(100).optional(),
  passingYear: Joi.number().integer().min(1950).max(2100).optional(),
  age: Joi.number().integer().min(14).max(60).optional(),
  previousTeam: Joi.string().trim().max(100).optional(),
  basePrice: Joi.number().min(0).optional(),
  imageUrl: Joi.string().uri().optional(),
  stats: statsSchema.optional(),
}).min(1);

export const bulkStatusSchema = Joi.object({
  playerIds: Joi.array().items(objectId).min(1).required(),
  isDeleted: Joi.boolean().required(),
});

export const bulkAuctionStatusSchema = Joi.object({
  playerIds: Joi.array().items(objectId).min(1).required(),
  auctionStatus: Joi.string()
    .valid(...Object.values(PlayerAuctionStatus))
    .required(),
});

export const playerIdParamSchema = Joi.object({
  id: objectId.required(),
});
