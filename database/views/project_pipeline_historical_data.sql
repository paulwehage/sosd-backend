-- noinspection SqlNoDataSourceInspectionForFile

CREATE VIEW project_pipeline_historical_data AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    cp.id AS pipeline_id,
    cp.pipeline_name,
    cp.repo_name,
    cp.branch,
        DATE(cpr.start_time) AS date,
        SUM(cpsm.co2_consumption) AS total_co2_consumption
        FROM
        projects p
        JOIN project_sdlc_steps pss ON p.id = pss.project_id
        JOIN cicd_pipelines cp ON pss.id = cp.project_sdlc_step_id
        JOIN cicd_pipeline_runs cpr ON cp.id = cpr.cicd_pipeline_id
        JOIN cicd_pipeline_step_measurements cpsm ON cpr.id = cpsm.cicd_pipeline_run_id
        GROUP BY
        p.id, p.name, cp.id, cp.pipeline_name, cp.repo_name, cp.branch, DATE(cpr.start_time)
        ORDER BY
        p.id, cp.id, date;