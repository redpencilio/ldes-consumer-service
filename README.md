# LDES Consumer Service

This service listens to resource additions to a time-based LDES stream and publishes those additions to a virtuoso triplestore.

The following environment variables can be provided:

-   `LDES_ENDPOINT_VIEW`: the ldes endpoint containing the view (the first page) of the stream

-   `LDES_STREAM`: the uri of the stream which is being consumed
-   `LDES_RELATION_PATH`: the predicate which is being used to define relations. For time-based streams, this will almost always be http://www.w3.org/ns/prov#generatedAtTime.

-   `LDES_POLLING_INTERVAL`: the polling interval in milliseconds of the client which fetches resources from and endpoint
-   `REPLACE_VERSIONS`: boolean which indicates whether to remove old versions of a resource when adding a new version or not
-   `MU_APPLICATION_GRAPH`: The graph where the data should be injested

Note, when using this service you can either choose to send the sparql queries to a mu-authorization endpoint or to the virtuoso triplestore directly. When consuming a large dataset, sending the sparql queries to the triplestore directly will be more performant.
