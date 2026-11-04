CREATE TABLE `contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`category` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contribution_user_year_category` ON `contributions` (`user_id`,`year`,`category`);--> statement-breakpoint
CREATE TABLE `interests` (
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interest_user_reward` ON `interests` (`user_id`,`reward_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`started` integer DEFAULT false NOT NULL,
	`recognition` integer DEFAULT false NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
