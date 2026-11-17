CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deck_id` text NOT NULL,
	`card_id` text NOT NULL,
	`direction` text NOT NULL,
	`rating` text NOT NULL,
	`source` text NOT NULL,
	`client_name` text,
	`duration_ms` integer,
	`reviewed_at` integer NOT NULL,
	`previous_state` text,
	`previous_memory` text,
	`undone_at` integer
);
--> statement-breakpoint
CREATE INDEX `reviews_user_reviewed_idx` ON `reviews` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE TABLE `study_states` (
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`direction` text NOT NULL,
	`deck_id` text NOT NULL,
	`state` text NOT NULL,
	`stability` real NOT NULL,
	`stability_fast` real NOT NULL,
	`difficulty` real NOT NULL,
	`due_at` integer NOT NULL,
	`last_review_at` integer,
	`reps` integer NOT NULL,
	`lapses` integer NOT NULL,
	`scheduled_days` real NOT NULL,
	`learning_step` integer NOT NULL,
	`suspended` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `card_id`, `direction`)
);
--> statement-breakpoint
CREATE INDEX `study_states_user_due_idx` ON `study_states` (`user_id`,`due_at`);