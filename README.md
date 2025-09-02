# LDES Consumer Service

This service uses a consumer (based on  https://github.com/rdf-connect/ldes-client) to fetch new versions of resources (members) from an (time-based) LDES stream.
You can learn more about LDES at https://semiceu.github.io/LinkedDataEventStreams/.

By default the service will start polling when the LDES feed has been consumed. You can disable this by setting the `RUN_ONCE` ENV var to `true`. Consumer state can be saved in a json file under /data, make sure to enable this by setting `PERSIST_STATE` to true and mounting /data in a local volume if you want it to be persisted when recreating the container.

## Integrating the consumer service in a semantic.works project

Add the following snipped to your docker-compose.yml to include the consumer service:

```
consumer:
  image: redpencil/ldes-consumer
  volumes:
    - ./data/ldes-consumer:/data
```


## Configuration

The service can be configured with the following environment variables:

| Environment variable | Default | Description |
|----------------------|---------|-------------|
| `INGEST_MODE` | `ALL` | How the LDES feed should be ingested. Valid options are `ALL` and `MATERIALIZE`. `ALL` will ingest all versioned members as-is and store them in the triplestore. `MATERIALIZE` will store the [materializations of the members](https://semiceu.github.io/LinkedDataEventStreams/#version-materializations). |
| `REPLACE_VERSIONS` | `true` | Whether to remove old versions of a resource when adding a new version or not. |
| `PERSIST_STATE` | `false` | Whether to persist the state of the LDES client. The state is stored as a file in `/data/hostname($LDES_ENDPOINT_VIEW)-state.json`, make sure to mount the data folder to have access to store the state across container rebuilds! |
| `LDES_ENDPOINT_VIEW` | N/A (required) | The view of the LDES endpoint that will be ingested. If not set, the service will not start. |
| `LDES_POLLING_INTERVAL` | `60000` | Number of milliseconds before refetching uncacheable fragments |
| `LDES_REQUESTS_PER_MINUTE` | `0` (unlimited) | How many requests per minutes may be sent to the same host. This is optional, but any passed in value must be a positive number. |
| `LDES_INFO_REQUEST_TIMEOUT` | `60000` | Number of milliseconds to wait on the LDES info at startup of the stream. If the info is not received in time, the process will be terminated. |
| `LDES_ENDPOINT_HEADERS` | `{}` (no headers will be added) | Extra headers that will be added to the requests sent to the LDES endpoint. Recommended syntax:<pre>environment:<br>  LDES_ENDPOINT_HEADERS: ><br>    { "HEADER-NAME": "header-value" } # The leading whitespace is important!</pre> |
| `LDES_VERSION_OF_PATH` | `undefined` (will use LDES feed metadata) | The predicate to be used to find the link to the non version object. If no value is provided and the LDES feed does not provide the metadata, the service will throw an error after starting. |
| `LDES_TIMESTAMP_PATH` | `undefined` (will use LDES feed metadata) | The predicate to be used to find the timestamp of an object. If no value is provided and the LDES feed does not provide the metadata, the service will throw an error after starting. |
| `SPARQL_ENDPOINT_HEADER_<key>` | N/A | A header key-value combination which should be send as part of the headers to the SPARQL endpoint. |
| `SPARQL_BATCH_SIZE` | `0` (disabled) | The amount of triples sent per query, used to work around triplestore query-length limitations. Value must be a non-negative integer. If set to 0, no batching will be applied. |
| `SPARQL_AUTH_USER` | N/A | Optional value to provide a username to be used in a digest auth to be sent to the SPARQL endpoint. |
| `SPARQL_AUTH_PASSWORD` | N/A | Optional value to provide a password to be used in a digest auth to be sent to the SPARQL endpoint. |
| `BLANK_NODE_NAMESPACE` | `http://mu.semte.ch/blank#` | namespace to use for skolemizing blank nodes. |
| `RUN_ONCE` | `false` | Set to true to run the consumer only once, this disables polling. (useful when running the service as a Kubernetes CronJob).
| `MU_APPLICATION_GRAPH` | See [semantic.works default graph](https://github.com/mu-semtech/mu-javascript-template/blob/d3281b8dff24502919a75147f7737b83d4dd724f/Dockerfile#L8) | The graph where the data should be ingested. |
| `MU_SPARQL_ENDPOINT` | `http://database:8890/sparql` | SPARQL endpoint to connect to. |
| `LOG_SPARQL_ALL` | `false` | Log executed SPARQL queries |
| `DEBUG_AUTH_HEADERS` | `false` | Debugging of [mu-authorization](https://github.com/mu-semtech/mu-authorization) access-control related headers |


> [!WARNING]
> The following environment variables are **deprecated** and slated to be removed at a later time, but still supported:

| Environment variable | Default | Description |
|----------------------|---------|-------------|
| `RUNONCE` | `false` | Set to true to run the consumer only once (e.g. when running the service as a Kubernetes CronJob). Replaced with `RUN_ONCE` environment variable. |

> [!CAUTION]
> The following environment variables are **no longer supported**:

| Environment variable | Reason | Description |
|----------------------|--------|-------------|
| `LDES_DEREFERENCE_MEMBERS` | The underlying library does not make dereferencing optional. | Whether to dereference members, because the collection pages do not contain all information. |
| `LDES_STREAM` | The underlying library stores the LDES stream state in a file and we no longer store this info in the triplestore. | The uri which should be used as a subject to store the latest page and timestamp consumed in the database. |
| `LDES_TIMESTAMP_PATH` | Materialization and versioning support is provided by the underlying library, which expects to find this information attached to the LDES feed. | The predicate to be used to find the timestamp of an object. |
| `LDES_VERSION_OF_PATH` | Materialization and versioning support is provided by the underlying library, which expects to find this information attached to the LDES feed.| The predicate to be used to find the link to the non version object. |
| `LDES_ENDPOINT_HEADER_<key>` | Newer versions of Node.js do not support environment variables with dashes in their name. Stuff like `LDES_ENDPOINT_HEADER_X-API-KEY` is no longer supported. | A header key-value combination which should be send as part of the headers to the LDES endpoint. E.g. `LDES_ENDPOINT_HEADER_X-API-KEY: <api_key>`. |
