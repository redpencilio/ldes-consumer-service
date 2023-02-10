# LDES Consumer Service

This service uses a consumer (based on https://github.com/TREEcg/event-stream-client/tree/main/packages/actor-init-ldes-client) to fetch new versions of resources (members) from an (time-based) LDES stream.
You can learn more about LDES at https://semiceu.github.io/LinkedDataEventStreams/.

The consumer is run periodically using a cron job. Each time it is run, it checks if new members have been added to the LDES stream and adds them to the virtuoso endpoint.

## Integrating the consumer service in a semantic.works project

Add the following snipped to your docker-compose.yml to include the consumer service:

```
consumer:
    image: redpencil/ldes-consumer
```


## Configuration

The service can be configured with the following environment variables:

- `BLANK_NODE_NAMESPACE` [string]: namespace to use for skolemizing blank nodes (default 'http://mu.semte.ch/blank#')
- `RUNONCE` [boolean]: set to true to run the consumer only once (e.g. when running the service as a Kubernetes CronJob). (default: `false`)
- `CRON_PATTERN` [string]: the cron pattern which the cronjob should use. (default: `* 0 * * * *`)
- `DEBUG_AUTH_HEADERS`: Debugging of [mu-authorization](https://github.com/mu-semtech/mu-authorization) access-control related headers (default `false`)
- `LDES_ENDPOINT_HEADER_<key>` [string]: A header key-value combination which should be send as part of the headers to the LDES ENDPOINT. E.g. `LDES_ENDPOINT_HEADER_X-API-KEY: <api_key>`.
- `LDES_ENDPOINT_VIEW` [string]: the ldes endpoint containing the view (the first page) of the stream.
- `LDES_STREAM` [string]: the uri which should be used as a subject to store the latest page and timestamp consumed in the database. (default: `http://mu.semte.ch/example-stream`)
- `LDES_VERSION_OF_PATH` [string]: the predicate to be used to find the link to the non version object, default: `dcterms:isVersionOf`)
- `LDES_TIMESTAMP_PATH` [string]: the predicate to be used to find the timestamp of an object, default: `prov:generatedAtTime`)
- `LOG_SPARQL_ALL` [boolean]: log executed SPARQL queries (default: `false`)
- `MU_APPLICATION_GRAPH` [string]: The graph where the data should be ingested. (default: see [semantic.works default graph](https://github.com/mu-semtech/mu-javascript-template/blob/d3281b8dff24502919a75147f7737b83d4dd724f/Dockerfile#L8))
- `MU_SPARQL_ENDPOINT` [string]: SPARQL endpoint to connect to, defaults to 'http://database:8890/sparql'
- `REPLACE_VERSIONS` [boolean]: boolean which indicates whether to remove old versions of a resource when adding a new version or not (default: `true`)
- `SPARQL_AUTH_PASSWORD` [string]: provide a passwords to be used in a digest auth to be sent to the SPARQL endpoint.
- `SPARQL_AUTH_USER` [string]: (optional) provide a username to be used in a digest auth to be sent to the SPARQL endpoint.
- `SPARQL_ENDPOINT_HEADER_<key>` [string]: A header key-value combination which should be send as part of the headers to the SPARQL ENDPOINT.
- `SPARQL_BATCH_SIZE` [integer]: amount of triples sent per query. To work around triplestore query-length limitations (default: `0` - disabled).
