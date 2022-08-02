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

-   `LDES_RELATION_PATH` [string]: the predicate which is being used to define relations. For time-based streams, this will almost always be http://www.w3.org/ns/prov#generatedAtTime. (default: `http://www.w3.org/ns/prov#generatedAtTime`)

-   `LDES_POLLING_INTERVAL` [number]: the polling interval in milliseconds of the client which fetches resources from and endpoint (default: `500`)

-   `REPLACE_VERSIONS` [boolean]: boolean which indicates whether to remove old versions of a resource when adding a new version or not (default: `true`)

-   `MU_APPLICATION_GRAPH` [string]: The graph where the data should be injested. (default: `http://mu.semte.ch/graphs/public`)

-   `CRON_PATTERN` [string]: the cron pattern which the cronjob should use. (default: `* 0 * * * *`)
