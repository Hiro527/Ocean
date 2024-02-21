import { Context } from 'hono';
import { D1QB } from 'workers-qb';
import { authUserByToken } from '../lib/auth';
import { getPostRecursive } from '../lib/posts';

const contentSearch = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const searchType = c.req.query('type') as searchTypeString | '';
        const searchQuery = c.req.query('q');

        const authResult = await authUserByToken(c);

        if (!authResult) {
            return c.json({ error: { message: 'Login required' } }, 401);
        }

        const user = authResult;

        let result: ExtendedPost[] | User[];

        switch (searchType) {
            case '':
            case 'post': {
                const fetchedPosts = await qb
                    .fetchAll({
                        tableName: 'posts',
                        fields: '*',
                        where: {
                            conditions: 'body like ?1',
                            params: [`%${searchQuery}%`],
                        },
                    })
                    .execute();

                const posts = (fetchedPosts.results as Post[]).filter((p) => p.post_type === 'post' || p.post_type === 'reply');

                const postTrees: ExtendedPost[] = [];

                await Promise.all(
                    posts.map(async (p) => {
                        postTrees.push(await getPostRecursive(qb, p));
                    }),
                );

                result = postTrees;
                break;
            }
            case 'user': {
                const fetchedProfiles = await qb
                    .fetchAll({
                        tableName: 'users',
                        fields: '*',
                        where: {
                            conditions: 'id like ?1 or display_name like ?1',
                            params: [`%${searchQuery}%`],
                        },
                    })
                    .execute();

                const profiles = fetchedProfiles.results as User[];

                result = profiles;
                break;
            }
        }

        return c.json({ ok: true, result }, 200);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

export const search = {
    contentSearch,
};
