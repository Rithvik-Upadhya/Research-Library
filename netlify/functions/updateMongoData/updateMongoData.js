import { MongoClient } from "mongodb";
import remapZoteroData from "../../utils/remapZoteroData";
import fetch from "node-fetch";

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export async function handler(event) {
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_COLLECTION);
    const newestItem = await collection
        .find({})
        .sort({ version: -1 })
        .limit(1)
        .toArray();
    const currentDBVersion = 80 || newestItem[0].version;
    console.log(currentDBVersion);

    const patchedDataURL = `https://api.zotero.org/groups/4433711/items`;
    const deletedDataURL = `https://api.zotero.org/groups/4433711/deleted?since=${currentDBVersion}`;

    const patchedDataResponse = await fetch(patchedDataURL, {
        headers: {
            "Zotero-API-Key": process.env.ZOTERO_API_KEY,
            "If-Modified-Since-Version": currentDBVersion,
        },
    });
    const deletedDataResponse = await fetch(deletedDataURL, {
        headers: {
            "Zotero-API-Key": process.env.ZOTERO_API_KEY,
        },
    });

    console.log(patchedDataResponse);

    console.log(await deletedDataResponse.text());

    // const [patchedDataResponse, deletedDataResponse] = await Promise.all([
    //     fetch(patchedDataURL, {
    //         headers: {
    //             "Zotero-API-Key": process.env.ZOTERO_API_KEY,
    //             "If-Modified-Since-Version": currentDBVersion,
    //         },
    //     }),
    //     fetch(deletedDataURL, {
    //         headers: {
    //             "Zotero-API-Key": process.env.ZOTERO_API_KEY,
    //         },
    //     }),
    // ]);

    // const [patchedItems, deletedData] = await Promise.all([
    //     patchedDataResponse.ok && patchedDataResponse.json(),
    //     deletedDataResponse.json(),
    // ]);

    // const deletedItemKeys = deletedData.items;

    // const deletePayload = deletedItemKeys.map((deletedItemKey) => ({
    //     deleteOne: {
    //         filter: { key: deletedItemKey },
    //     },
    // }));
    // let patchPayload = [];

    // if (patchedDataResponse.ok) {
    //     const remappedPatches = remapZoteroData(patchedItems);
    //     patchPayload = remappedPatches.map((remappedPatch) => ({
    //         replaceOne: {
    //             filter: { key: remappedPatch.key },
    //             replacement: remappedPatch,
    //             upsert: true,
    //         },
    //     }));
    // } else {
    //     console.error(
    //         `Zotero patch request returned with response: ${patchedDataResponse.status} ${patchedDataResponse.statusText}.`
    //     );
    // }

    // const bulkWritePayload = deletePayload.concat(patchPayload);
    // console.log(bulkWritePayload);
    // const bulkWriteResult =
    //     bulkWritePayload.length &&
    //     (await collection.bulkWrite(bulkWritePayload, {
    //         ordered: false,
    //     }));
    // console.log(bulkWriteResult);

    // const eventBody = JSON.parse(event.body);
    // console.log(`Next function run at ${eventBody.next_run}.`);
    return {
        statusCode: 200,
    };
}
