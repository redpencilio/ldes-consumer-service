# LDES Consumer Service Tests

These are a set of tests that verify the behaviour of the ldes consumer.

They work by providing a [docker-compose.tests.yml](docker-compose.tests.yml) file.

You can use the [run-development.sh](run-development.sh) script to start and clear the database of the containers.

**Provided in the docker are**:
- virtuoso database
- ldes-stub: this is a stub using express that returns a fixed (time-based) LDES stream of 3 pages, with rich data (nested data, several types, language strings, etc). The LDES example also uses a json ld format with a provided context. You can also mimic failures, using `config endpoint`, and add new items to the stream using the `/instancesnapshot/:instanceId` endpoint
- ldes-consumer-no-persist-state: a build of the ldes-consumer (the current checked out version) is done. It is configured to read the ldes from the ldes-stub every 10 seconds. Does not persist its state, re-reads the entire stream every time.
- ldes-consumer-with-persist-state: similar, but with state persisting, configured to verify if new data is present on a page every 20 seconds.

To clear virtuoso database, and clean up, and start containers, you can use script:
```shell
 ./run-development.sh --clear-test-data
```

The tests need to be run from the IDE for now. No CI build provided yet.

There are already three end-to-end tests provided:
- [read-ldes-stream.it-test.ts](reading-ldes-stream%2Fread-ldes-stream.it-test.ts): 
  - queries the virtuoso database, and verifies in detail that members of the LDES stream of all three pages were saved correctly,
  - adds a new member to last page of stream, and verifies this was saved as well,
  - assumes the `ldes-consumer-no-persist-state` docker container was used. 
  - tests work (if run first).
- [reading-using-persist-state.it-test.ts](reading-ldes-stream%2Freading-using-persist-state.it-test.ts): 
  - queries the virtuoso database, and verifies briefly that members of the LDES stream of all three pages were saved correctly,
  - adds a new member to last page of stream, and verifies this was saved as well,
  - assumes the `ldes-consumer-with-persist-state` docker container was used.
  - test of the initial reading of data works.
  - test of the new item on last page, does not work.
- [reading-from-unserviceable-ldes-stream.it-test.ts](reading-ldes-stream%2Freading-from-unserviceable-ldes-stream.it-test.ts)
  - verifies how the ldes consumer service reacts on reading from an LDES that is (temporarily) unserviceable, and how the ldes consumer service recovers from it.
  - is done by using `config endpoint` of stub, thereby mimicking connection end, connection destroy, http 500, http 404, invalid json ld from the ldes stub, driven by the test code.
  - both for reading ldes page, as the json ld context file.
  - the reading of the ldes page seems to mess up the in memory state mechanism, nothing new is read, even if the ldes recovers.
  - the json ld context file crashes the ldes consumer service. no auto restart was added to docker container.
  - no test is currently working.
  - assumes the `ldes-consumer-no-persist-state` docker container was used, but the `ldes-consumer-with-persist-state` docker container experiences same problems

