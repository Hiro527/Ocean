-- Migration number: 0001 	 2024-02-16T06:12:47.053Z
create table users (
    id varchar(32) not null unique collate nocase primary key,
    uid varchar(36) not null,
    display_name varchar(32) not null,
    bio text default '',
    birthday timestamp,
    icon_url text,
    banner_url text,
    created_at timestamp default current_stamp,
    updated_at timestamp default current_stamp
);