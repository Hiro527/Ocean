type Token = {
    token: string;
    uid: string;
    expire_date: number;
    created_at: string;
};

type Session = {
    id: string;
    token: string;
    expire_date: string;
    created_at: string;
};

type Auth = {
    uid: string;
    salt: string;
    sha256: string;
    created_at: string;
    update_at: string;
};

type User = {
    id: string;
    uid: string;
    display_name: string;
    bio: string;
    birthday: string;
    icon_url: string;
    banner_url: string;
    created_at: string;
    update_at: string;
};

type Post = {
    id: string;
    uid: string;
    body: string | null;
    post_type: string;
    base_post_id: string | null;
    deleted: 0 | 1;
    created_at: string;
};

type ExtendedPost = {
    id: string;
    user: User;
    body: string | null;
    post_type: 'post' | 'like' | 'repost' | 'reply';
    base_post_id: string | null;
    base_post: ExtendedPost | null;
    likes: ExtendedPost[];
    reposts: ExtendedPost[];
    replies: ExtendedPost[];
    created_at: string;
};
