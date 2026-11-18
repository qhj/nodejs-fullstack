-- Create "todos" table
CREATE TABLE `todos` (`id` integer NULL PRIMARY KEY AUTOINCREMENT, `title` text NOT NULL, `completed` integer NOT NULL DEFAULT false);
