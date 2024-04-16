## feature/stability-improvements:1.0 (2024-04-16)

#### :rocket: Enhancement
* actor-init-ldes-client
  * Add tracing logs to easier follow the flow of the reading and parsing of the LDES stream
* ldes-consumer-service
  * Add `LDES_LOGGING_LEVEL` option to set logging level for actor-init-ldes-client library
  * Print all relevant params to console on startup
  * Add `SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA` option : when the ldes stream returns members out of order in relation to the generatedAtTime triple, this allows to still save them all

#### :bug: Bug Fix
* actor-init-ldes-client
  * When multiple predicates existed between a subject and an object (:s :p :o), only one was saved
  * Resume read stream again (after it has been paused by node's stream back pressure feature)
  * Error handling: propagate errors to outer ldes read stream, so client can act accordingly
  * Add option to `reportErrorOnEmptyPage` when an ldes page contains no (parseable) members
* ldes-consumer-service
  * Fix broken conversion of Blank Nodes
  * Implement work-around for not passed along environment variables from docker to node process when they contain '-' characters (e.g. X-API-KEY)
  * Use `reportErrorOnEmptyPage` to capture incorrect pages, and stop the reading automatically

#### :house: Internal
* Test suite added
* Upgraded to mu-javascript-template-1.8.0
* Uses Woodpecker to create builds
* Fix several compile errors and warnings
* Upgrade to latest version of actor-init-ldes-client + integrate a series of patches for it 

## 0.8.0-rc1 (2023-08-29)

#### :boom: Breaking Change
* [#36](https://github.com/redpencilio/ldes-consumer-service/pull/36) Feature/better processing ([@nvdk](https://github.com/nvdk))

#### :rocket: Enhancement
* [#36](https://github.com/redpencilio/ldes-consumer-service/pull/36) Feature/better processing ([@nvdk](https://github.com/nvdk))

#### :bug: Bug Fix
* [#39](https://github.com/redpencilio/ldes-consumer-service/pull/39) Feature/better processing correction version handling ([@cecemel](https://github.com/cecemel))
* [#40](https://github.com/redpencilio/ldes-consumer-service/pull/40) Ensure when fetching latest timestamp, the query sorts results ([@cecemel](https://github.com/cecemel))

#### Committers: 2
- Niels V ([@nvdk](https://github.com/nvdk))
- [@cecemel](https://github.com/cecemel)

## 0.7.1 (2023-07-28)

#### :rocket: Enhancement
* [#32](https://github.com/redpencilio/ldes-consumer-service/pull/32)  provide options to configure ldes client  ([@nvdk](https://github.com/nvdk))

#### Committers: 2
- Niels V ([@nvdk](https://github.com/nvdk))
- [@gauquiebart](https://github.com/gauquiebart)


## 0.7.0 (2023-02-10)

#### :rocket: Enhancement
* [#26](https://github.com/redpencilio/ldes-consumer-service/pull/26) batched queries ([@MikiDi](https://github.com/MikiDi))
* [#29](https://github.com/redpencilio/ldes-consumer-service/pull/29) update running state, regardless of success or fail ([@MikiDi](https://github.com/MikiDi))
* [#27](https://github.com/redpencilio/ldes-consumer-service/pull/27) improved string-formatting of sparql queries for cleaner log output ([@MikiDi](https://github.com/MikiDi))
* [#25](https://github.com/redpencilio/ldes-consumer-service/pull/25) Add option to run only once ([@MPParsley](https://github.com/MPParsley))

#### :bug: Bug Fix
* [#23](https://github.com/redpencilio/ldes-consumer-service/pull/23) blank nodes skolemization now works with immutable quads ([@MikiDi](https://github.com/MikiDi))

#### :house: Internal
* [#30](https://github.com/redpencilio/ldes-consumer-service/pull/30) Fix linting and ignore or fix ts errors ([@elpoelma](https://github.com/elpoelma))
* [#28](https://github.com/redpencilio/ldes-consumer-service/pull/28) State update improvements ([@MikiDi](https://github.com/MikiDi))
* [#24](https://github.com/redpencilio/ldes-consumer-service/pull/24) use recommended rdfjs types ([@MikiDi](https://github.com/MikiDi))

#### Committers: 3
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))
- Maarten Segers ([@MPParsley](https://github.com/MPParsley))
- Michaël Dierick ([@MikiDi](https://github.com/MikiDi))

## 0.6.0 (2023-01-12)

#### :rocket: Enhancement
* [#7](https://github.com/redpencilio/ldes-consumer-service/pull/7) provide support for sparql endpoint authentication ([@nvdk](https://github.com/nvdk))
* [#19](https://github.com/redpencilio/ldes-consumer-service/pull/19) Filter duplicate triples ([@MPParsley](https://github.com/MPParsley))
* [#14](https://github.com/redpencilio/ldes-consumer-service/pull/14) make version_of and timestamp path configurable and check timestamp ([@nvdk](https://github.com/nvdk))

#### :bug: Bug Fix
* [#21](https://github.com/redpencilio/ldes-consumer-service/pull/21) Fix copy-paste typo in config for timestamp path ([@MikiDi](https://github.com/MikiDi))

#### :house: Internal
* [#22](https://github.com/redpencilio/ldes-consumer-service/pull/22) Fix doc on default graph ([@MikiDi](https://github.com/MikiDi))

#### Committers: 3
- Maarten Segers ([@MPParsley](https://github.com/MPParsley))
- Michaël Dierick ([@MikiDi](https://github.com/MikiDi))
- Niels V ([@nvdk](https://github.com/nvdk))

## 0.5.0 (2022-10-04)

#### :rocket: Enhancement
* [#12](https://github.com/redpencilio/ldes-consumer-service/pull/12) Add initial support for custom SPARQL headers ([@elpoelma](https://github.com/elpoelma))

#### Committers: 1
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))

## 0.4.0 (2022-09-28)

#### :rocket: Enhancement
* [#11](https://github.com/redpencilio/ldes-consumer-service/pull/11) Feature: better state representation ([@elpoelma](https://github.com/elpoelma))

#### :house: Internal
* [#10](https://github.com/redpencilio/ldes-consumer-service/pull/10) Set up feature builds ([@elpoelma](https://github.com/elpoelma))

#### Committers: 1
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))

## 0.3.0 (2022-09-19)

#### :rocket: Enhancement
* [#9](https://github.com/redpencilio/ldes-consumer-service/pull/9) Include custom header support ([@elpoelma](https://github.com/elpoelma))

#### :bug: Bug Fix
* [#6](https://github.com/redpencilio/ldes-consumer-service/pull/6) change default cron pattern to run every minute ([@nvdk](https://github.com/nvdk))

#### Committers: 2
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))
- Niels V ([@nvdk](https://github.com/nvdk))

## 0.2.3 (2022-09-09)

#### :bug: Bug Fix
* [#8](https://github.com/redpencilio/ldes-consumer-service/pull/8) Update consumer library ([@elpoelma](https://github.com/elpoelma))

#### Committers: 1
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))

## 0.2.2 (2022-08-09)

#### :bug: Bug Fix
* [#5](https://github.com/redpencilio/ldes-consumer-service/pull/5) add error handling to callback function ([@elpoelma](https://github.com/elpoelma))

#### Committers: 1
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))

## 0.2.1 (2022-08-08)

## 0.2.0 (2022-08-05)

#### :rocket: Enhancement
* [#3](https://github.com/redpencilio/ldes-consumer-service/pull/3) Introduction of seperate Consumer class and change in the polling strategy ([@elpoelma](https://github.com/elpoelma))

#### Committers: 1
- Elena Poelman ([@elpoelma](https://github.com/elpoelma))

