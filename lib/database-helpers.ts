import { query } from 'mu';

const PING_DB_INTERVAL_MILLIS = 2000;

const isDatabaseUp = async function() {
  let isUp = false;
  try {
    await sendDummyQuery();
    isUp = true;
  } catch (_e) {
    console.log("Waiting for database... ");
  }
  return isUp;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const waitForDatabase = async function(callback: () => unknown) {
  let loop = true;
  while (loop) {
    loop = !(await isDatabaseUp());
    await sleep(PING_DB_INTERVAL_MILLIS);
  }
  callback();
};

const sendDummyQuery = async function() {
  try {
    const _result = await query(`
      SELECT ?s
      WHERE {
        GRAPH ?g {
          ?s ?p ?o
        }
      }
      LIMIT 1
    `);
  } catch (e: unknown) {
    throw new Error((e as Error).toString());
  }
};

export { waitForDatabase }
