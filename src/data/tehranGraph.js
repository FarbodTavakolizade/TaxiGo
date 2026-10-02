/**
 * A deliberately small graph of the main Tehran roads, used to demonstrate
 * Dijkstra's shortest path algorithm in this university project.
 *
 * This is NOT an accurate model of Tehran. It contains a handful of
 * well-known squares connected by approximate road distances, which is
 * enough to show how the algorithm works.
 *
 *   Node = a place on the map (square, airport, station)
 *   Edge = a road between two places, with a distance in km
 */

const TEHRAN_NODES = [
  { id: 'azadi',            name: 'Azadi Square',       lat: 35.6997, lng: 51.3380 },
  { id: 'sadeghieh',        name: 'Sadeghieh Square',   lat: 35.7100, lng: 51.3300 },
  { id: 'mehrabad',         name: 'Mehrabad Airport',   lat: 35.6892, lng: 51.3134 },
  { id: 'enghelab',         name: 'Enghelab Square',    lat: 35.7010, lng: 51.3900 },
  { id: 'valiasr',          name: 'Valiasr Junction',   lat: 35.7125, lng: 51.4070 },
  { id: 'ferdowsi',         name: 'Ferdowsi Square',    lat: 35.7000, lng: 51.4170 },
  { id: 'vanak',            name: 'Vanak Square',       lat: 35.7575, lng: 51.4100 },
  { id: 'tajrish',          name: 'Tajrish Square',     lat: 35.8040, lng: 51.4340 },
  { id: 'resalat',          name: 'Resalat Square',     lat: 35.7440, lng: 51.4650 },
  { id: 'haftetir',         name: 'Haft-e Tir Square',  lat: 35.7080, lng: 51.4250 },
  { id: 'imamhossein',      name: 'Imam Hossein Square', lat: 35.6900, lng: 51.4420 },
  { id: 'darvazehshemiran', name: 'Darvazeh Shemiran',  lat: 35.6900, lng: 51.4380 },
  { id: 'rahahan',          name: 'Rah Ahan Square',    lat: 35.6580, lng: 51.3980 },
];

// Each edge connects two nodes in both directions with an approximate
// road distance in kilometers.
const TEHRAN_EDGES = [
  { from: 'azadi',       to: 'enghelab',         km: 6.5 },
  { from: 'azadi',       to: 'sadeghieh',        km: 2.5 },
  { from: 'azadi',       to: 'mehrabad',         km: 3.2 },
  { from: 'sadeghieh',   to: 'mehrabad',         km: 4.0 },
  { from: 'sadeghieh',   to: 'vanak',            km: 8.5 },
  { from: 'enghelab',    to: 'valiasr',          km: 2.0 },
  { from: 'enghelab',    to: 'ferdowsi',         km: 2.4 },
  { from: 'enghelab',    to: 'rahahan',          km: 5.0 },
  { from: 'valiasr',     to: 'ferdowsi',         km: 2.3 },
  { from: 'valiasr',     to: 'vanak',            km: 5.5 },
  { from: 'ferdowsi',    to: 'haftetir',         km: 1.7 },
  { from: 'ferdowsi',    to: 'imamhossein',      km: 3.0 },
  { from: 'vanak',       to: 'tajrish',          km: 6.8 },
  { from: 'vanak',       to: 'resalat',          km: 5.0 },
  { from: 'tajrish',     to: 'resalat',          km: 5.8 },
  { from: 'resalat',     to: 'haftetir',         km: 3.4 },
  { from: 'haftetir',    to: 'imamhossein',      km: 2.5 },
  { from: 'haftetir',    to: 'darvazehshemiran', km: 2.2 },
  { from: 'imamhossein', to: 'darvazehshemiran', km: 1.2 },
  { from: 'darvazehshemiran', to: 'rahahan',     km: 3.4 },
];

module.exports = { TEHRAN_NODES, TEHRAN_EDGES };
