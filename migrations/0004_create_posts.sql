-- Migration number: 0004 	 2024-02-16T06:15:39.609Z
create table posts (
    id varchar(36) not null primary key,
    uid varchar(36) not null,
    body text default null,
    post_type varchar(16) not null default 'post',
    base_post_id varchar(36) default null,
    deleted integer default 0,
    created_at timestamp default current_timestamp
);