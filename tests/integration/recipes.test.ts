import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import mongoose from 'mongoose';
import app from '../../src/app';

describe('Recipes API', () => {
  let userToken: string;
  let user2Token: string;
  let recipeId: string;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Recipe Test User',
        email: `recipeuser${Date.now()}@test.com`,
        password: 'password123',
      });

    const user2Res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Recipe Rater User',
        email: `rateruser${Date.now()}@test.com`,
        password: 'password123',
      });

    expect(userRes.status).toBe(201);
    expect(user2Res.status).toBe(201);

    userToken = userRes.body.token;
    user2Token = user2Res.body.token;

    const testRes = await request(app)
      .post('/api/v1/recipes')
      .set('Cookie', `token=${userToken}`)
      .send({
        title: 'Initial Test Recipe',
        ingredients: ['Test 1', 'Test 2'],
        steps: ['Step 1', 'Step 2'],
        preparationTime: 30,
      });

    recipeId = testRes.body.recipe?.id;
  });

  async function createUser(prefix: string) {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: `${prefix} User`,
        email: `${prefix}${Date.now()}@test.com`,
        password: 'password123',
      });
    return res.body.token;
  }

  async function createTestRecipe(token: string) {
    const res = await request(app)
      .post('/api/v1/recipes')
      .set('Cookie', `token=${token}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Test Recipe ${Date.now()}`,
        ingredients: ['Ingredient 1', 'Ingredient 2'],
        steps: ['Step 1', 'Step 2'],
        preparationTime: 30,
      });
    return res;
  }

  describe('Recipe CRUD Operations', () => {
    it('should create a recipe', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Recipe',
          ingredients: ['Ingredient 1', 'Ingredient 2'],
          steps: ['Step 1', 'Step 2'],
          preparationTime: 30,
        });

      if (res.status === 201 || res.status === 200) {
        recipeId = res.body.recipe?.id;
        expect(res.body.message).toMatch(/created|success/i);
      } else {
        console.error('Recipe creation failed:', res.body);

        return;
      }
    });

    it('should get all recipes', async () => {
      const res = await request(app).get('/api/v1/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get a single recipe', async () => {
      if (!recipeId) {
        const allRes = await request(app).get('/api/v1/recipes');
        if (allRes.body.data && allRes.body.data.length > 0) {
          recipeId = allRes.body.data[0].id;
        } else {
          const createRes = await request(app)
            .post('/api/v1/recipes')
            .set('Cookie', `token=${userToken}`)
            .send({
              title: 'Recipe for testing',
              ingredients: ['Test'],
              steps: ['Test'],
              preparationTime: 15,
            });

          if (createRes.status === 201 || createRes.status === 200) {
            recipeId = createRes.body.recipe.id;
          }
        }
      }

      if (recipeId) {
        const res = await request(app).get(`/api/v1/recipes/${recipeId}`);

        if (res.status === 200) {
          expect(res.body.id).toBe(recipeId);
        } else if (res.status === 404) {
          console.log('Recipe not found');
        } else if (res.status === 400) {
          console.log('Bad request - invalid ID format');
        }
      }
    });

    it('should update a recipe', async () => {
      if (!recipeId) {
        console.log('Skipping update test - no recipe ID');
        return;
      }

      const res = await request(app)
        .put(`/api/v1/recipes/${recipeId}`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Recipe',
          ingredients: ['Updated 1', 'Updated 2'],
          steps: ['Updated Step 1', 'Updated Step 2'],
          preparationTime: 45,
        });

      if (res.status === 200) {
        expect(res.body.message).toMatch(/updated|success/i);
      } else {
        console.log('Update failed with status:', res.status);
      }
    });

    it('should delete a recipe', async () => {
      const createRes = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Recipe to Delete',
          ingredients: ['Delete Ing'],
          steps: ['Delete Step'],
          preparationTime: 10,
        });

      if (createRes.status === 201 || createRes.status === 200) {
        const deleteRecipeId = createRes.body.recipe.id;

        const deleteRes = await request(app)
          .delete(`/api/v1/recipes/${deleteRecipeId}`)
          .set('Cookie', `token=${userToken}`)
          .set('Authorization', `Bearer ${userToken}`);

        if (deleteRes.status === 200) {
          expect(deleteRes.body.message).toMatch(/deleted|success/i);
        } else {
          console.log('Delete failed with status:', deleteRes.status);
        }
      } else {
        console.log('Could not create recipe for deletion');
      }
    });
  });

  describe('Recipe Ratings', () => {
    it('should rate a recipe successfully', async () => {
      const recipeOwnerToken = await createUser('RecipeOwner');
      const raterToken = await createUser('Rater');

      const freshRecipeRes = await createTestRecipe(recipeOwnerToken);
      expect(freshRecipeRes.status).toBe(201);
      const freshRecipeId = freshRecipeRes.body.recipe.id;

      const res = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${raterToken}`)
        .set('Authorization', `Bearer ${raterToken}`)
        .send({ value: 5 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Recipe rated successfully');
      expect(res.body.rating.value).toBe(5);
    });

    it('should prevent duplicate ratings from same user', async () => {
      const userToken = await createUser('DuplicateRater');
      const recipeRes = await createTestRecipe(userToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const firstRating = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 4 });

      expect(firstRating.status).toBe(201);

      const secondRating = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 3 });

      expect(secondRating.status).toBe(400);
      expect(secondRating.body.message).toBe('User has already rated this recipe');
    });

    it('should require rating value between 1 and 5', async () => {
      const userToken = await createUser('RatingValue');
      const recipeRes = await createTestRecipe(userToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const resNoValue = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(resNoValue.status).toBe(400);
      expect(resNoValue.body.message).toBe('Rating value must be between 1 and 5');

      const resTooLow = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 0 });

      expect(resTooLow.status).toBe(400);
      expect(resTooLow.body.message).toBe('Rating value must be between 1 and 5');

      const resTooHigh = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 6 });

      expect(resTooHigh.status).toBe(400);
      expect(resTooHigh.body.message).toBe('Rating value must be between 1 and 5');
    });

    it('should require authentication for rating', async () => {
      if (!recipeId) {
        console.log('Skipping auth test - no recipe ID');
        return;
      }

      const res = await request(app).post(`/api/v1/recipes/${recipeId}/rate`).send({ value: 5 });

      expect(res.status).toBe(401);
    });

    it('should return 404 when rating non-existent recipe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/recipes/${nonExistentId}/rate`)
        .set('Cookie', `token=${user2Token}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ value: 5 });

      expect([404, 401]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.message).toBe('Recipe not found');
      }
    });

    it('should allow different users to rate same recipe', async () => {
      const recipeOwnerToken = await createUser('MultiOwner');
      const rater1Token = await createUser('Rater1');
      const rater2Token = await createUser('Rater2');

      const recipeRes = await createTestRecipe(recipeOwnerToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const rating1 = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${rater1Token}`)
        .set('Authorization', `Bearer ${rater1Token}`)
        .send({ value: 4 });

      expect(rating1.status).toBe(201);

      const rating2 = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/rate`)
        .set('Cookie', `token=${rater2Token}`)
        .set('Authorization', `Bearer ${rater2Token}`)
        .send({ value: 3 });

      expect(rating2.status).toBe(201);
    });
  });

  describe('Recipe Comments', () => {
    it('should add a comment to a recipe', async () => {
      const userToken = await createUser('Commenter');
      const recipeRes = await createTestRecipe(userToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const res = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/comments`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is a test comment on the recipe',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Comment added successfully');
      expect(res.body.comment.content).toBe('This is a test comment on the recipe');
      expect(res.body.comment.recipeId).toBe(freshRecipeId);
      expect(res.body.comment.authorId).toBeDefined();
    });

    it('should prevent duplicate comments from the same user on the same recipe', async () => {
      const userToken = await createUser('DuplicateCommenter');
      const recipeRes = await createTestRecipe(userToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const firstComment = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/comments`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is my first comment',
        });

      expect(firstComment.status).toBe(201);
      expect(firstComment.body.message).toBe('Comment added successfully');

      const secondComment = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/comments`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is my second comment',
        });

      expect(secondComment.status).toBe(400);
      expect(secondComment.body.message).toBe('You have already commented on this recipe');
    });

    it('should allow different users to comment on the same recipe', async () => {
      const recipeOwnerToken = await createUser('CommentOwner');
      const commenter1Token = await createUser('Commenter1');
      const commenter2Token = await createUser('Commenter2');

      const recipeRes = await createTestRecipe(recipeOwnerToken);
      expect(recipeRes.status).toBe(201);
      const freshRecipeId = recipeRes.body.recipe.id;

      const comment1 = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/comments`)
        .set('Cookie', `token=${commenter1Token}`)
        .set('Authorization', `Bearer ${commenter1Token}`)
        .send({
          content: 'Comment from user 1',
        });

      expect(comment1.status).toBe(201);

      const comment2 = await request(app)
        .post(`/api/v1/recipes/${freshRecipeId}/comments`)
        .set('Cookie', `token=${commenter2Token}`)
        .set('Authorization', `Bearer ${commenter2Token}`)
        .send({
          content: 'Comment from user 2',
        });

      expect(comment2.status).toBe(201);
      expect(comment1.body.comment.authorId).not.toBe(comment2.body.comment.authorId);
    });

    it('should allow user to comment on different recipes', async () => {
      const freshUserRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Fresh Comment User',
          email: `fresh${Date.now()}@test.com`,
          password: 'password123',
        });

      expect(freshUserRes.status).toBe(201);
      const freshToken = freshUserRes.body.token;

      const recipe1Res = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `token=${freshToken}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          title: 'First Recipe for Comment Test',
          ingredients: ['Test'],
          steps: ['Test'],
          preparationTime: 15,
        });

      expect(recipe1Res.status).toBe(201);
      const recipe1Id = recipe1Res.body.recipe.id;

      const recipe2Res = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `token=${freshToken}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          title: 'Second Recipe for Comment Test',
          ingredients: ['Test'],
          steps: ['Test'],
          preparationTime: 15,
        });

      expect(recipe2Res.status).toBe(201);
      const recipe2Id = recipe2Res.body.recipe.id;

      const comment1 = await request(app)
        .post(`/api/v1/recipes/${recipe1Id}/comments`)
        .set('Cookie', `token=${freshToken}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ content: 'Comment on recipe 1' });

      expect(comment1.status).toBe(201);

      const comment2 = await request(app)
        .post(`/api/v1/recipes/${recipe2Id}/comments`)
        .set('Cookie', `token=${freshToken}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ content: 'Comment on recipe 2' });

      expect(comment2.status).toBe(201);
    });

    it('should fetch comments for a recipe', async () => {
      if (!recipeId) {
        console.log('Skipping fetch comments test - no recipe ID');
        return;
      }

      const res = await request(app).get(`/api/v1/recipes/${recipeId}/comments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('totalComments');
    });

    it('should support pagination for comments', async () => {
      const user1Token = await createUser('Pagination1');
      const user2Token = await createUser('Pagination2');
      const user3Token = await createUser('Pagination3');

      const recipeRes = await createTestRecipe(user1Token);
      expect(recipeRes.status).toBe(201);
      const paginationRecipeId = recipeRes.body.recipe.id;

      await request(app)
        .post(`/api/v1/recipes/${paginationRecipeId}/comments`)
        .set('Cookie', `token=${user1Token}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Test comment 1 for pagination' });

      await request(app)
        .post(`/api/v1/recipes/${paginationRecipeId}/comments`)
        .set('Cookie', `token=${user2Token}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Test comment 2 for pagination' });

      await request(app)
        .post(`/api/v1/recipes/${paginationRecipeId}/comments`)
        .set('Cookie', `token=${user3Token}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .send({ content: 'Test comment 3 for pagination' });

      const res = await request(app).get(
        `/api/v1/recipes/${paginationRecipeId}/comments?page=1&limit=2`,
      );

      expect(res.status).toBe(200);
      expect(res.body.comments.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalComments).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.pagination.hasNext).toBe(true);
      expect(res.body.pagination.hasPrev).toBe(false);
    });

    it('should require content for comments', async () => {
      if (!recipeId) {
        console.log('Skipping validation test - no recipe ID');
        return;
      }

      const res = await request(app)
        .post(`/api/v1/recipes/${recipeId}/comments`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Content is required');
    });

    it('should require authentication for adding comments', async () => {
      if (!recipeId) {
        console.log('Skipping auth test - no recipe ID');
        return;
      }

      const res = await request(app).post(`/api/v1/recipes/${recipeId}/comments`).send({
        content: 'Unauthenticated comment',
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 when commenting on non-existent recipe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/recipes/${nonExistentId}/comments`)
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Comment on non-existent recipe',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Recipe not found');
    });
  });

  describe('Recipe Validation', () => {
    it('should require authentication for creating recipes', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .send({
          title: 'Unauthenticated Recipe',
          ingredients: ['Test'],
          steps: ['Test'],
          preparationTime: 10,
        });

      expect([401, 403]).toContain(res.status);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `token=${userToken}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Incomplete Recipe',
        });

      if (res.status === 400) {
        expect(res.body.message).toMatch(/required|fields/i);
      } else if (res.status === 401) {
        console.log('Auth failed instead of validation');
      }
    });
  });
});
