CREATE TABLE `receipt_items` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`raw_name` text NOT NULL,
	`quantity` real DEFAULT 1,
	`unit_price` real,
	`total_price` real NOT NULL,
	`normalized_item_id` text,
	`line_number` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`store_name` text NOT NULL,
	`purchase_date` text NOT NULL,
	`subtotal` real,
	`tax` real,
	`total` real NOT NULL,
	`image_path` text NOT NULL,
	`thumbnail_path` text,
	`parsed_at` text,
	`manually_edited` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`notes` text
);
