DROP VIEW IF EXISTS project_service_historical_data;
CREATE VIEW project_service_historical_data AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    infra_serv.id AS service_id,
    infra_serv.type AS service_type,
    cp.name AS cloud_provider_name,
    oiec.date AS date,
    SUM(oiec.co2_consumption) AS total_co2_consumption
FROM
    projects p
    JOIN project_sdlc_steps pss ON p.id = pss.project_id
    JOIN operations_infrastructure_elements oie ON pss.id = oie.project_sdlc_step_id
    JOIN infrastructure_services infra_serv ON oie.infrastructure_service_id = infra_serv.id
    JOIN cloud_providers cp ON infra_serv.cloud_provider_id = cp.id
    JOIN operations_infrastructure_elements_consumption oiec ON oie.id = oiec.infrastructure_element_id
GROUP BY
    p.id, p.name, infra_serv.id, infra_serv.type, cp.name, oiec.date
ORDER BY
    p.id, infra_serv.id, date;