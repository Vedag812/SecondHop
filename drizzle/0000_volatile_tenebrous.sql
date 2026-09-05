CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`previous_state` text,
	`new_state` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail_json` text NOT NULL,
	`previous_hash` text,
	`current_hash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `handoffs` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`condition_confirmed` integer,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `idempotency_records` (
	`key` text PRIMARY KEY NOT NULL,
	`operation` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mandates` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`maximum_charge_paise` integer NOT NULL,
	`approved_at` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`return_id` text NOT NULL,
	`intent_id` text NOT NULL,
	`exact_sku` integer NOT NULL,
	`rules_json` text NOT NULL,
	`approved` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`radius_km` integer NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `original_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`serial_number` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`razorpay_payment_id` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_serial` ON `original_orders` (`serial_number`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`razorpay_order_id` text NOT NULL,
	`razorpay_payment_id` text,
	`amount_paise` integer NOT NULL,
	`status` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payments_idempotency` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant_id` text NOT NULL,
	`sku` text NOT NULL,
	`model` text NOT NULL,
	`variant` text NOT NULL,
	`category` text NOT NULL,
	`warranty` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_merchant_sku` ON `products` (`merchant_id`,`sku`);--> statement-breakpoint
CREATE TABLE `purchase_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`original_input` text NOT NULL,
	`structured_json` text NOT NULL,
	`price_ceiling_paise` integer NOT NULL,
	`maximum_distance_km` integer NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`beneficiary` text NOT NULL,
	`razorpay_refund_id` text,
	`amount_paise` integer NOT NULL,
	`status` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_refunds_idempotency` ON `refunds` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `returns` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`reason_original` text NOT NULL,
	`claimed_condition` text NOT NULL,
	`state` text NOT NULL,
	`eligibility` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`processed_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
