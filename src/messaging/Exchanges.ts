// Superseded by topology.ts, which declares exchanges, queues, AND bindings
// together (a queue declared with no binding is useless, so it made sense to
// stop splitting them up). Keeping this export so nothing that already
// imports `setupExchange` breaks — feel free to delete this file once you've
// updated your server.ts to call setupTopology() directly instead.
export { setupTopology as setupExchange } from "./topology.js";
