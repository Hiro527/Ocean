import { Context } from 'hono';

import { D1QB } from 'workers-qb';
import { v4 } from 'uuid';

import { authUserByToken } from '../lib/auth';

import { getPostRecursive } from '../lib/posts';

const create = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const body = await c.req.json<createPostBody>();

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult;
        const uuid = v4();

        await qb
            .insert({
                tableName: 'posts',
                data: {
                    id: uuid,
                    uid: user.uid,
                    body: body.body,
                },
            })
            .execute();

        return c.json({ ok: true }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const delete_post = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const postId = c.req.param('id');

        if (!postId) {
            return c.json({ error: { message: 'Post id required' } }, 400);
        }

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult as User;

        const fetchedPost = await qb
            .fetchOne({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'id = ?1',
                    params: [postId],
                },
            })
            .execute();

        const post = fetchedPost.results as Post;

        if (post.uid !== user.uid) {
            return c.json({ error: { message: "You don't have permission to delete this post" } }, 403);
        }

        if (post.deleted) {
            return c.json({ error: { message: 'This post has already deleted' } }, 400);
        }

        await qb
            .update({
                tableName: 'posts',
                data: {
                    deleted: 1,
                },
                where: {
                    conditions: 'id = ?1',
                    params: [postId],
                },
            })
            .execute();

        return c.json({ ok: true }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const getById = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const postId = c.req.param('id');

        if (!postId) {
            return c.json({ error: { message: 'Post id required' } }, 400);
        }

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const result = await qb
            .fetchOne({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'id = ?1 and deleted = 0',
                    params: [postId],
                },
            })
            .execute();

        const post = result.results as Post;

        if (!post) {
            return c.json({ error: { message: 'Post not found' } }, 404);
        }

        const postTree = await getPostRecursive(qb, post);

        return c.json({ ok: true, postTree }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const getByUser = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const id = c.req.param('id');

        if (!id) {
            return c.json({ error: { message: 'ID or UID required' } }, 400);
        }

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }
        const fetchedUser = await qb
            .fetchOne({
                tableName: 'users',
                fields: '*',
                where: {
                    conditions: 'uid = ?1 or id = ?1',
                    params: [id],
                },
            })
            .execute();

        const author = fetchedUser.results as User;

        if (!author) {
            return c.json({ error: { message: 'User not found' } }, 404);
        }

        const result = await qb
            .fetchAll({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'uid = ?1 and deleted = 0',
                    params: [author.uid],
                },
            })
            .execute();

        const posts = (result.results as Post[]).filter((p) => p.post_type === 'post' || p.post_type === 'reply');

        const postTrees: ExtendedPost[] = [];

        await Promise.all(
            posts.map(async (p) => {
                postTrees.push(await getPostRecursive(qb, p));
            }),
        );

        return c.json({ ok: true, posts: postTrees }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const getMyPosts = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const limit = parseInt(c.req.query('limit') ?? '100');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult as User;

        const result = await qb
            .fetchAll({
                tableName: 'posts',
                fields: '*',
                limit: limit,
                where: {
                    conditions: 'uid = ?1 and deleted = 0',
                    params: [user.uid],
                },
            })
            .execute();

        const posts = (result.results as Post[]).filter((p) => p.post_type === 'post' || p.post_type === 'reply');

        const postTrees: ExtendedPost[] = [];

        await Promise.all(
            posts.map(async (p) => {
                postTrees.push(await getPostRecursive(qb, p));
            }),
        );

        return c.json({ ok: true, posts: postTrees }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const getPosts = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const limit = parseInt(c.req.query('limit') ?? '100');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult as User;

        const result = await qb
            .fetchAll({
                tableName: 'posts',
                fields: '*',
                limit: limit,
                where: {
                    conditions: 'deleted = 0',
                    params: [],
                },
            })
            .execute();

        const posts = result.results as Post[];

        const postTrees: ExtendedPost[] = [];

        await Promise.all(
            posts.map(async (p) => {
                postTrees.push(await getPostRecursive(qb, p));
            }),
        );

        return c.json({ ok: true, posts: postTrees }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const like = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const post_id = c.req.param('id');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult;

        // Check if the user has already liked the post
        const fetchedLikePost = await qb
            .fetchOne({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'post_type = "like" and base_post_id = ?1 and deleted = 0 and uid = ?2',
                    params: [post_id, user.uid],
                },
            })
            .execute();

        const likePost = fetchedLikePost.results as Post;
        const uuid = v4();

        if (!likePost) {
            // If the user has not liked the post
            await qb
                .insert({
                    tableName: 'posts',
                    data: {
                        id: uuid,
                        uid: user.uid,
                        post_type: 'like',
                        base_post_id: post_id,
                    },
                })
                .execute();
        } else {
            // If the uesr has already liked the post
            await qb
                .update({
                    tableName: 'posts',
                    data: {
                        deleted: 1,
                    },
                    where: {
                        conditions: 'uid = ?1',
                        params: [likePost.uid],
                    },
                })
                .execute();
        }
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
    return c.json({ ok: true }, 200);
};

const repost = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const post_id = c.req.param('id');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult;

        // Check if the user has already reposted the post
        const fetchedLikePost = await qb
            .fetchOne({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'post_type = "repost" and base_post_id = ?1 and deleted = 0 and uid = ?2',
                    params: [post_id, user.uid],
                },
            })
            .execute();

        const repostedPost = fetchedLikePost.results as Post;
        const uuid = v4();

        if (!repostedPost) {
            // If the user has not reposted the post
            await qb
                .insert({
                    tableName: 'posts',
                    data: {
                        id: v4(),
                        uid: user.uid,
                        post_type: 'repost',
                        base_post_id: post_id,
                    },
                })
                .execute();
        } else {
            // If the uesr has already liked the post
            await qb
                .update({
                    tableName: 'posts',
                    data: {
                        deleted: 1,
                    },
                    where: {
                        conditions: 'id = ?1',
                        params: [repostedPost.uid],
                    },
                })
                .execute();
        }
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
    return c.json({ ok: true }, 200);
};

const reply = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const body = await c.req.json<createPostBody>();
        const post_id = c.req.param('id');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult;

        const uuid = v4();

        await qb
            .insert({
                tableName: 'posts',
                data: {
                    id: uuid,
                    uid: user.uid,
                    post_type: 'reply',
                    body: body.body,
                    base_post_id: post_id,
                },
            })
            .execute();

        return c.json({ ok: true }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

export const posts = {
    create,
    getById,
    getByUser,
    getMyPosts,
    getPosts,
    delete_post,
    like,
    repost,
    reply,
};
