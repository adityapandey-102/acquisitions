import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { eq } from 'drizzle-orm';
import { user } from '#models/user.model.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .from(user);
  } catch (error) {
    logger.error('Error getting users', error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [foundUser] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!foundUser) {
      throw new Error('User not found');
    }

    return foundUser;
  } catch (error) {
    logger.error('Error getting user by ID', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Perform the update with updatedAt timestamp
    const [updatedUser] = await db
      .update(user)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });

    return updatedUser;
  } catch (error) {
    logger.error('Error updating user', error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Delete the user
    await db.delete(user).where(eq(user.id, id));

    logger.info(
      `User with ID ${id} (${existingUser.email}) deleted successfully`
    );
    return { id: existingUser.id, email: existingUser.email };
  } catch (error) {
    logger.error('Error deleting user', error);
    throw error;
  }
};
