import { D1QB } from 'workers-qb';

export const getPostRecursive = async (qb: D1QB, post: Post) => {
    let basePost: ExtendedPost | null = null;
    if (post.post_type === 'like' || post.post_type === 'repost') {
        const fetchedPost = await qb
            .fetchOne({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'id = ?1 and deleted = 0',
                    params: [post.base_post_id],
                },
            })
            .execute();

        const interectedPost: Post = fetchedPost.results;
        basePost = await getPostRecursive(qb, interectedPost);
    }

    const likes = (
        await qb
            .fetchAll({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'post_type = "like" and base_post_id = ?1 and deleted = 0',
                    params: [post.id],
                },
            })
            .execute()
    ).results as Post[];

    const reposts = (
        await qb
            .fetchAll({
                tableName: 'posts',
                fields: '*',
                where: {
                    conditions: 'post_type = "repost" and base_post_id = ?1 and deleted = 0',
                    params: [post.id],
                },
            })
            .execute()
    ).results as Post[];

    const fetchedReplies = await qb
        .fetchAll({
            tableName: 'posts',
            fields: '*',
            where: {
                conditions: 'post_type = "reply" and base_post_id = ?1 and deleted = 0',
                params: [post.id],
            },
        })
        .execute();

    const authorProfile = (
        await qb
            .fetchOne({
                tableName: 'users',
                fields: '*',
                where: {
                    conditions: 'user_uuid = ?1',
                    params: [post.uid],
                },
            })
            .execute()
    ).results as User;

    const postTree: ExtendedPost = {
        id: post.id,
        user: authorProfile,
        body: post.body,
        post_type: post.post_type,
        base_post_id: post.base_post_id,
        base_post: basePost,
        likes: likes,
        reposts: reposts,
        replies: [],
        created_at: post.created_at,
    };

    await Promise.all(
        Object.values(fetchedReplies.results as Post[]).map(async (p) => {
            const repliesTree = await getPostRecursive(qb, p);
            postTree.replies.push(repliesTree);
        }),
    );

    return postTree;
};
