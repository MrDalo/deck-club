CREATE TABLE `idempotency_keys` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`reservation_id` text NOT NULL,
	`state` text NOT NULL,
	`response_body` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `key`)
);
