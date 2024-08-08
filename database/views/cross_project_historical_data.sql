-- noinspection SqlNoDataSourceInspectionForFile

CREATE VIEW cross_project_historical_data AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
        DATE(COALESCE(cpr.start_time, omv.timestamp)) AS date,
        SUM(COALESCE(cpsm.co2_consumption, 0) + COALESCE(omv.value_decimal, 0)) AS total_co2_consumption
        FROM
        projects p
        LEFT JOIN project_sdlc_steps pss ON p.id = pss.project_id
        LEFT JOIN cicd_pipelines cp ON pss.id = cp.project_sdlc_step_id
        LEFT JOIN cicd_pipeline_runs cpr ON cp.id = cpr.cicd_pipeline_id
        LEFT JOIN cicd_pipeline_step_measurements cpsm ON cpr.id = cpsm.cicd_pipeline_run_id
        LEFT JOIN operations_infrastructure_elements oie ON pss.id = oie.project_sdlc_step_id
        LEFT JOIN operations_metric_values omv ON oie.id = omv.infrastructure_element_id
        AND omv.metric_definition_id = (SELECT id FROM operations_metric_definitions WHERE metric_name = 'co2_consumption')
        GROUP BY
        p.id, p.name, DATE(COALESCE(cpr.start_time, omv.timestamp))
        ORDER BY
        p.id, date;