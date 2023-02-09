import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const uri = "mongodb://localhost:27017";
const dbname = 'area';
const tblname = 'area';

const client = new MongoClient(uri);
await client.connect();
const collection = await client.db(dbname).collection(tblname);

async function save(adcode, data) {
  const query = { adcode };
  const update = { $set: { ...data, adcode } };
  const options = { upsert: true };

  return await collection.updateOne(query, update, options);
}

// http://datav.aliyun.com/portal/school/atlas/area_selector
async function crawler(adcode, full) {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=${adcode}${full ? '_full' : ''}`;
  try {
    const res = await fetch(url, { type: 'GET' });
    if (res.status === 404) {
      console.log('load not full', adcode);
      return await crawler(adcode, false);
    }
    const data = await res.json();
    console.log('save', adcode);
    await save(adcode, data);
    if (!full) return;
    for (let feature of data.features.values()) {
      let {
        adcode,
        name,
      } = feature.properties;

      if (typeof adcode === 'string') continue;
      console.log('load', adcode, name);
      await crawler(adcode, true);
    }
  } catch (e) {
    console.log('err', e);
  }
}

await crawler(100000, true);
await client.close();
console.log('done');
