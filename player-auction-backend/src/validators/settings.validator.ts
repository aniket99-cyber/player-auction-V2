import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  defaultTeamBudget: Joi.number().min(0).optional(),
  requiredPlayersPerTeam: Joi.number().min(1).optional(),
  defaultBidIncrementRules: Joi.array()
    .items(
      Joi.object({
        upTo: Joi.number().min(0).required(),
        increment: Joi.number().min(1).required(),
      }),
    )
    .min(1)
    .optional(),
}).min(1);
