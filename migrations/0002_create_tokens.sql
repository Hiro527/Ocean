-- Migration number: 0002 	 2024-02-16T06:14:53.184Z
create table tokens (
    token varchar(32) not null primary key,
    uid varchar(36) not null,
    expire_date timestamp not null,
    created_at timestamp default current_timestamp
);