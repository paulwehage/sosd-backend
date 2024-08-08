-- noinspection SqlNoDataSourceInspectionForFile

DROP VIEW IF EXISTS operations_historical_data;
CREATE VIEW operations_historical_data AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    oie.id AS infrastructure_element_id,
    oie.name AS infrastructure_element_name,
    infra_serv.type AS infrastructure_service_type,
    infra_serv.category AS infrastructure_service_category,
    cp.name AS cloud_provider_name,
    oie.tag,
        DATE(omv.timestamp) AS date,
        SUM(CAST(SUBSTRING_INDEX(omv.value_string, ' ', 1) AS DECIMAL(10,2))) AS total_co2_consumption
        FROM
        projects p
        JOIN project_sdlc_steps pss ON p.id = pss.project_id
        JOIN operations_infrastructure_elements oie ON pss.id = oie.project_sdlc_step_id
        JOIN infrastructure_services infra_serv ON oie.infrastructure_service_id = infra_serv.id
        JOIN cloud_providers cp ON infra_serv.cloud_provider_id = cp.id
        JOIN operations_metric_values omv ON oie.id = omv.infrastructure_element_id
        JOIN operations_metric_definitions omd ON omv.metric_definition_id = omd.id
        WHERE
        omd.metric_name = 'Weekly CO2 Consumption'
        GROUP BY
        p.id, p.name, oie.id, oie.name, infra_serv.type, infra_serv.category, cp.name, oie.tag, DATE(omv.timestamp)
        ORDER BY
        p.id, oie.id, date;