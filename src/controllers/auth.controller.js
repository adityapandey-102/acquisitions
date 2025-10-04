import logger from '#config/logger.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { formValidationError } from '#utils/format.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import { jwtToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formValidationError(validationResult.error),
      });
    }

    const { name, email, role, password } = validationResult.data;

    // AUTH SERVICE
    const user = await createUser({ name, email, password, role });

    // Create Token
    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);
    console.log(validationResult);
    res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Signup error', e);
    if (e.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already exist' });
    }
    next(e);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    // AUTH SERVICE
    const user = await authenticateUser({ email, password });

    // Create Token
    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);
    res.status(200).json({
      message: 'User signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Signin error', e);
    if (e.message === 'User not found' || e.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(e);
  }
};

export const signout = async (req, res, next) => {
  try {
    // Get the token from cookies to log which user is signing out
    const token = cookies.get(req, 'token');

    if (token) {
      try {
        const decoded = jwtToken.verify(token);
        logger.info(`User signed out successfully: ${decoded.email}`);
      } catch (e) {
        // Token might be invalid/expired, but we still want to clear the cookie
        logger.info('User signed out (invalid/expired token cleared)', e);
      }
    } else {
      logger.info('User signed out (no token found)');
    }

    // Clear the authentication cookie
    cookies.clear(res, 'token');

    res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (e) {
    logger.error('Signout error', e);
    next(e);
  }
};
