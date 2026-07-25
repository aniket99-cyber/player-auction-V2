import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
