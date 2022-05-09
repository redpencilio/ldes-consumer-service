FROM semtech/mu-javascript-template:1.6.0
LABEL maintainer="madnificent@gmail.com"

ENV LDES_ENDPOINT_VIEW "http://ldes-time-fragmenter:3000/example/1"
ENV LDES_STREAM "http://example.org/example-stream"
ENV LDES_RELATION_PATH "http://www.w3.org/ns/prov#generatedAtTime"
ENV LDES_POLLING_INTERVAL 500 
ENV REPLACE_VERSIONS "true"
