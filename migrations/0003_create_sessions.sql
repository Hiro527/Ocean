-- Migration number: 0003 	 2024-02-16T06:15:15.158Z
create table sessions (
    id varchar(36) not null primary key,
    token varchar(32) not null,
    expire_date timestamp not null,
    created_at timestamp default current_timestamp
);