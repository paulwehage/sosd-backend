CREATE TABLE `projects` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `sdlc_steps` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` ENUM ('Integration/Deployment', 'Testing', 'Development', 'Design', 'Planning', 'Operations')
);

CREATE TABLE `project_sdlc_steps` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_id` integer,
  `sdlc_step_id` integer
);

CREATE TABLE `project_sdlc_historical_data` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_id` integer,
  `sdlc_step_id` integer,
  `date` date,
  `co2_consumption` decimal,
  `average_co2_consumption` decimal
);

CREATE TABLE `cicd_pipelines` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_sdlc_step_id` integer,
  `repo_name` varchar(255),
  `branch` varchar(255),
  `cloud_provider` varchar(255),
  `pipeline_name` varchar(255)
);

CREATE TABLE `cicd_pipeline_runs` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `cicd_pipeline_id` integer,
  `run_number` integer,
  `start_time` timestamp,
  `end_time` timestamp,
  `total_duration` integer,
  `total_consumption` decimal
);

CREATE TABLE `cicd_pipeline_step_measurements` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `cicd_pipeline_run_id` integer,
  `step_name` varchar(255),
  `step_type` ENUM ('integration', 'deployment'),
  `sub_step_name` varchar(255),
  `duration` integer,
  `consumption` decimal
);

CREATE TABLE `cicd_pipeline_historical_data` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `cicd_pipeline_id` integer,
  `date` date,
  `total_consumption` decimal,
  `average_consumption` decimal,
  `total_runs` integer
);

CREATE TABLE `sci_measurements` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_id` integer,
  `measured_at` timestamp,
  `sci_value` decimal,
  `co2_consumption` decimal
);

CREATE TABLE `operations_infrastructure_elements` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_sdlc_step_id` integer,
  `name` varchar(255),
  `type` varchar(255),
  `cloud_provider` varchar(255)
);

CREATE TABLE `operations_metric_definitions` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `element_type` varchar(255),
  `metric_name` varchar(255),
  `data_type` ENUM ('integer', 'decimal', 'string')
);

CREATE TABLE `operations_metric_values` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `infrastructure_element_id` integer,
  `metric_definition_id` integer,
  `value_int` integer,
  `value_decimal` decimal,
  `value_string` varchar(255),
  `timestamp` timestamp
);

CREATE TABLE `operations_historical_data` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `infrastructure_element_id` integer,
  `metric_definition_id` integer,
  `date` date,
  `average_value_decimal` decimal,
  `total_value_decimal` decimal
);

CREATE TABLE `user_flows` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_id` integer,
  `name` varchar(255),
  `co2_consumption` decimal
);

CREATE TABLE `project_co2_consumption` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `project_id` integer,
  `total_co2_consumption` decimal,
  `average_co2_consumption` decimal,
  `start_date` date,
  `end_date` date
);

ALTER TABLE `project_sdlc_steps` ADD FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

ALTER TABLE `project_sdlc_steps` ADD FOREIGN KEY (`sdlc_step_id`) REFERENCES `sdlc_steps` (`id`);

ALTER TABLE `project_sdlc_historical_data` ADD FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

ALTER TABLE `project_sdlc_historical_data` ADD FOREIGN KEY (`sdlc_step_id`) REFERENCES `sdlc_steps` (`id`);

ALTER TABLE `cicd_pipelines` ADD FOREIGN KEY (`project_sdlc_step_id`) REFERENCES `project_sdlc_steps` (`id`);

ALTER TABLE `cicd_pipeline_runs` ADD FOREIGN KEY (`cicd_pipeline_id`) REFERENCES `cicd_pipelines` (`id`);

ALTER TABLE `cicd_pipeline_step_measurements` ADD FOREIGN KEY (`cicd_pipeline_run_id`) REFERENCES `cicd_pipeline_runs` (`id`);

ALTER TABLE `cicd_pipeline_historical_data` ADD FOREIGN KEY (`cicd_pipeline_id`) REFERENCES `cicd_pipelines` (`id`);

ALTER TABLE `sci_measurements` ADD FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

ALTER TABLE `operations_infrastructure_elements` ADD FOREIGN KEY (`project_sdlc_step_id`) REFERENCES `project_sdlc_steps` (`id`);

ALTER TABLE `operations_metric_values` ADD FOREIGN KEY (`infrastructure_element_id`) REFERENCES `operations_infrastructure_elements` (`id`);

ALTER TABLE `operations_metric_values` ADD FOREIGN KEY (`metric_definition_id`) REFERENCES `operations_metric_definitions` (`id`);

ALTER TABLE `operations_historical_data` ADD FOREIGN KEY (`infrastructure_element_id`) REFERENCES `operations_infrastructure_elements` (`id`);

ALTER TABLE `operations_historical_data` ADD FOREIGN KEY (`metric_definition_id`) REFERENCES `operations_metric_definitions` (`id`);

ALTER TABLE `user_flows` ADD FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

ALTER TABLE `project_co2_consumption` ADD FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);
