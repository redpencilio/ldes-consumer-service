#!/bin/bash

if [ "$1" = "--help" ]
then
  echo "Starts up a docker container for tests using the local code for ldes-consumer-service".
  echo "This only starts the docker container in development mode. No tests are run".
  echo "You can use --clear-test-data to clear the test data folder before running".
  exit
fi

if [ "$1" = "--clear-test-data" ]
then
  echo "Clearing test data".
  rm -rf data-tests
  rm -rf test-results
fi

npm install
cd ldes-stub || exit
npm install
cd ..

cd ..
npm install
cd ./tests || exit

docker compose -f ./docker-compose.tests.yml -f ./docker-compose.tests.override.yml -p ldes-consumer-services-tests down --remove-orphans
docker compose -f ./docker-compose.tests.yml -f ./docker-compose.tests.override.yml -p ldes-consumer-services-tests pull
docker compose -f ./docker-compose.tests.yml -f ./docker-compose.tests.override.yml -p ldes-consumer-services-tests up -d --build
