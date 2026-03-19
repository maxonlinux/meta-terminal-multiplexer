CREATE TABLE IF NOT EXISTS `sim_scenarios` (
	`scenario_id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`stages` text NOT NULL,
	`total_steps` integer NOT NULL,
	`start_time` integer NOT NULL,
	`created_at` integer NOT NULL
);
