CREATE OR REPLACE VIEW project_sdlc_historical_data AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    ss.id AS sdlc_step_id,
    ss.name AS sdlc_step_name,
    DATE(COALESCE(cpr.start_time, oiec.date)) AS date,
    SUM(
    CASE
    WHEN ss.name = 'integration_deployment' THEN COALESCE(cpsm.co2_consumption, 0)
    WHEN ss.name = 'operations' THEN COALESCE(oiec.co2_consumption, 0)
    ELSE 0
    END
    ) AS total_co2_consumption
FROM
    projects p
    JOIN project_sdlc_steps pss ON p.id = pss.project_id
    JOIN sdlc_steps ss ON pss.sdlc_step_id = ss.id
    LEFT JOIN cicd_pipelines cp ON pss.id = cp.project_sdlc_step_id AND ss.name = 'integration_deployment'
    LEFT JOIN cicd_pipeline_runs cpr ON cp.id = cpr.cicd_pipeline_id
    LEFT JOIN cicd_pipeline_step_measurements cpsm ON cpr.id = cpsm.cicd_pipeline_run_id
    LEFT JOIN operations_infrastructure_elements oie ON pss.id = oie.project_sdlc_step_id AND ss.name = 'operations'
    LEFT JOIN operations_infrastructure_elements_consumption oiec ON oie.id = oiec.infrastructure_element_id
GROUP BY
    p.id, p.name, ss.id, ss.name, DATE(COALESCE(cpr.start_time, oiec.date))
ORDER BY
    p.id, ss.id, date;