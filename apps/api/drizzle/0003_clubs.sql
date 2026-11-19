CREATE TABLE `club_decks` (
	`club_id` text NOT NULL,
	`deck_id` text NOT NULL,
	`shared_by` text NOT NULL,
	`shared_at` integer NOT NULL,
	PRIMARY KEY(`club_id`, `deck_id`),
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `club_members` (
	`club_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`club_id`, `user_id`),
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `club_members_user_idx` ON `club_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`visibility` text NOT NULL,
	`invite_code` text NOT NULL,
	`member_limit` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_invite_code_idx` ON `clubs` (`invite_code`);