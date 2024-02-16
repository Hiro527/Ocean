-- Migration number: 0000 	 2024-02-16T06:11:27.377Z
create table auth (
    uid varchar(36) not null primary key,
    salt varchar(32) not null,
    sha256 varchar(64) not null,
    created_at timestamp default current_stamp,
    updated_at timestamp default current_stamp
);