const { z } = require('./common');

const email = z.string().trim().toLowerCase().regex(/^.+@.+\..+$/, 'email is not valid');

const registerSchema = z.object({
    fullName: z.string().trim().min(1, 'fullName is required'),
    email,
    password: z.string().min(8, 'password must be at least 8 characters'),
});

const loginSchema = z.object({
    email,
    password: z.string().min(1, 'password is required'),
});

module.exports = {
    registerSchema,
    loginSchema,
};
