import { D1QB } from 'workers-qb';

export const getUserFromID = async (qb: D1QB, searchQuery: string) => {
    const fetchedProfile = await qb
        .fetchOne({
            tableName: 'users',
            fields: '*',
            where: {
                conditions: 'uid = ?1',
                params: [searchQuery],
            },
        })
        .execute();

    const user = fetchedProfile.results as User;

    const fetchedUser = await qb
        .fetchOne({
            tableName: 'auth',
            fields: '*',
            where: {
                conditions: 'uid = ?1',
                params: [user.uid],
            },
        })
        .execute();

    const auth = fetchedUser.results as Auth;
    return auth;
};
