import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const createCaptainSchema = Joi.object({
  team: objectId.required(),
  player: objectId.required(),
});

export const updateCaptainSchema = Joi.object({
  player: objectId.required(),
});
