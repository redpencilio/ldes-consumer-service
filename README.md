# LDES Consumer Service

This service uses a consumer (based on https://github.com/TREEcg/event-stream-client/tree/main/packages/actor-init-ldes-client) to fetch new versions of resources (members) from an (time-based) LDES stream.
You can learn more about LDES at https://semiceu.github.io/LinkedDataEventStreams/.

The consumer is run periodically using a cron job. Each time it is run, it checks if new members have been added to the LDES stream and adds them to the virtuoso endpoint.

## Integrating the consumer service in a mu.semte.ch project

Add the following snipped to your docker-compose.yml to include the consumer service:

```
consumer:
    image: redpencil/ldes-consumer
```

## Configuration

The service can be configured with the following environment variables:

-   `LDES_ENDPOINT_VIEW` [string]: the ldes endpoint containing the view (the first page) of the stream.

-   `LDES_STREAM` [string]: the uri which should be used as a subject to store the latest page and timestamp consumed in the database. (default: `http://mu.semte.ch/example-stream`)

-   `REPLACE_VERSIONS` [boolean]: boolean which indicates whether to remove old versions of a resource when adding a new version or not (default: `true`)

-   `MU_APPLICATION_GRAPH` [string]: The graph where the data should be injested. (default: `http://mu.semte.ch/graphs/public`)

-   `CRON_PATTERN` [string]: the cron pattern which the cronjob should use. (default: `* 0 * * * *`)

-   `LDES_ENDPOINT_HEADER_<key>` [string]: A header key-value combination which should be send as part of the headers to the LDES ENDPOINT. E.g. `LDES_ENDPOINT_HEADER_X-API-KEY: <api_key>`.
-   `SPARQL_ENDPOINT_HEADER_<key>` [string]: A header key-value combination which should be send as part of the headers to the SPARQL ENDPOINT.
