import Joi from 'joi';
import { AuctionSelectionMode } from '@constants/enums';

const objectId = Joi.string().hex().length(24);

export const createAuctionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  playerQueue: Joi.array().items(objectId).min(1).required(),
  participatingTeams: Joi.array().items(objectId).min(1).required(),
  bidIncrementRules: Joi.array()
    .items(
      Joi.object({
        upTo: Joi.number().min(0).required(),
        increment: Joi.number().min(1).required(),
      }),
    )
    .min(1)
    .required(),
  selectionMode: Joi.string()
    .valid(...Object.values(AuctionSelectionMode))
    .optional(),
  settings: Joi.object({
    autoAdvance: Joi.boolean().optional(),
  }).optional(),
});

export const updateAuctionQueueSchema = Joi.object({
  playerQueue: Joi.array().items(objectId).min(1).required(),
});
