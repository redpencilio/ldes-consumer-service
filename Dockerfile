FROM semtech/mu-javascript-template:feature-node-18
LABEL maintainer="info@redpencil.io"
ENV PERSIST_STATE "false"
ENV LDES_ENDPOINT_VIEW "http://ldes-time-fragmenter:3000/example/1"
ENV LDES_STREAM "http://example.org/example-stream"
ENV REPLACE_VERSIONS "true"
ENV DEBUG_AUTH_HEADERS "false"
ENV LOG_SPARQL_ALL "false"