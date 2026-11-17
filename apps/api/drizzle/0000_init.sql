CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`deck_id` text NOT NULL,
	`type` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`extra` text NOT NULL,
	`tags` text NOT NULL,
	`source` text NOT NULL,
	`client_name` text,
	`version` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cards_deck_id_idx` ON `cards` (`deck_id`);--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`language` text NOT NULL,
	`tags` text NOT NULL,
	`visibility` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `decks_owner_id_idx` ON `decks` (`owner_id`);