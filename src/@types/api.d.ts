type registerBody = {
    id: string;
    display_name: string;
    password: string;
};

type loginBody = {
    id: string;
    password: string;
};

type updateBody = {
    id?: string;
    display_name?: string;
    birthday?: string;
    bio?: string;
};

type createPostBody = {
    body: string;
    attachments: string[];
};
