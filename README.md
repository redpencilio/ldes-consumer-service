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

- `BLANK_NODE_NAMESPACE` _[string]_: namespace to use for skolemizing blank nodes (default 'http://mu.semte.ch/blank#')
- `CRON_PATTERN` _[string]_: the cron pattern which the cronjob should use. (default: `* 0 * * * *`)
- `DEBUG_AUTH_HEADERS` _[boolean]_: Debugging of [mu-authorization](https://github.com/mu-semtech/mu-authorization) access-control related headers (default `false`)
- `LDES_DEREFERENCE_MEMBERS` _[boolean]_: whether to dereference members, because the collection pages do not contain all information (default: false)
- `LDES_ENDPOINT_HEADER_<infokey>` _[string]_: A header key-value combination which should be sent as part of the headers to the LDES ENDPOINT. E.g. `LDES_ENDPOINT_HEADER_XAPIKEY: 'X-API-KEY;<your key value here>'`.
- `LDES_ENDPOINT_VIEW` _[string]_: the ldes endpoint containing the view (the first page) of the stream.
- `LDES_POLLING_INTERVAL` _[number]_: Number of milliseconds before refetching uncacheable fragments (default: 60000)
- `LDES_REQUESTS_PER_MINUTE` _[number]_: how many requests per minutes may be sent to the same host (optional, any positive number)
- `LDES_STREAM` _[string]_: the uri which should be used as a subject to store the latest page and timestamp consumed in the database. (default: `http://mu.semte.ch/example-stream`)
- `LDES_TIMESTAMP_PATH` _[string]_: the predicate to be used to find the timestamp of an object, default: `prov:generatedAtTime`)
- `LDES_VERSION_OF_PATH` _[string]_: the predicate to be used to find the link to the non version object, default: `dcterms:isVersionOf`)
- `LOG_SPARQL_ALL` _[boolean]_: log executed SPARQL queries (default: `false`)
- `LDES_LOGGING_LEVEL` _[string]_: log level used by underlying ldes client library (default: 'info') (possible values: 'error', 'warn', 'info', 'debug', 'trace')
- `MU_APPLICATION_GRAPH` _[string]_: The graph where the data should be ingested. (default: see [semantic.works default graph](https://github.com/mu-semtech/mu-javascript-template/blob/d3281b8dff24502919a75147f7737b83d4dd724f/Dockerfile#L8)) 
- `MU_SPARQL_ENDPOINT` _[string]_: SPARQL endpoint to connect to, defaults to 'http://database:8890/sparql'
- `REPLACE_VERSIONS` _[boolean]_: boolean which indicates whether to remove old versions of a resource when adding a new version or not (default: `false`)
- `SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA` _[boolean]_: boolean which indicates that we want to save all entries from the ldes, even if a version in the stream has an earlier timestamp than one already saved. (default: `false`) 
- `RUNONCE` _[boolean]_: set to true to run the consumer only once (e.g. when running the service as a Kubernetes CronJob). (default: `false`)
- `SPARQL_AUTH_PASSWORD` _[string]_: provide a passwords to be used in a digest auth to be sent to the SPARQL endpoint.
- `SPARQL_AUTH_USER` _[string]_: (optional) provide a username to be used in a digest auth to be sent to the SPARQL endpoint.
- `SPARQL_BATCH_SIZE` [integer]: amount of triples sent per query. To work around triplestore query-length limitations (default: `0` - disabled).
- `SPARQL_ENDPOINT_HEADER_<key>` _[string]_: A header key-value combination which should be send as part of the headers to the SPARQL ENDPOINT.
- `PERSIST_STATE` _[boolean]_: whether to persist (and restore) state of the ldes client on consecutive runs. (default: `false`)
