CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`display_name` text,
	`category` text,
	`alternate_names` text,
	`auto_category` text,
	`category_source` text DEFAULT 'auto',
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_canonical_name_unique` ON `items` (`canonical_name`);