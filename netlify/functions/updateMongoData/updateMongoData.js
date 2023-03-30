import { schedule } from "@netlify/functions";
import { MongoClient } from "mongodb";
import remapZoteroData from "../../utils/remapZoteroData";
import fetch from "node-fetch";

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = schedule("*/10 * * * *", async (event) => {
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_COLLECTION);
    const newestItem = await collection
        .find({})
        .sort({ version: -1 })
        .limit(1)
        .toArray();
    const currentDBVersion = newestItem[0].version;

    const patchedDataURL = `https://api.zotero.org/groups/4433711/items?limit=100&format=json&v=3&since=${currentDBVersion}&itemType=-note`;
    const deletedDataURL = `https://api.zotero.org/groups/4433711/deleted?since=${currentDBVersion}`;
    const trashedDataURL = `https://api.zotero.org/groups/4433711/items/trash?limit=100&format=json&v=3&since=${currentDBVersion}`;

    const [patchedDataResponse, deletedDataResponse, trashedDataResponse] =
        await Promise.all([
            fetch(patchedDataURL, {
                headers: {
                    "Zotero-API-Key": process.env.ZOTERO_API_KEY,
                    "If-Modified-Since-Version": currentDBVersion,
                },
            }),
            fetch(deletedDataURL, {
                headers: {
                    "Zotero-API-Key": process.env.ZOTERO_API_KEY,
                },
            }),
            fetch(trashedDataURL, {
                headers: {
                    "Zotero-API-Key": process.env.ZOTERO_API_KEY,
                },
            }),
        ]);

    const [patchedJSON, deletedJSON, trashedJSON] = await Promise.all([
        patchedDataResponse.ok && patchedDataResponse.json(),
        deletedDataResponse.json(),
        trashedDataResponse.json(),
    ]);

    const patchedData = patchedJSON
        ? patchedJSON.map((patch) => patch.data)
        : [];
    const deletedItemKeys = deletedJSON.items;
    const trashedItemKeys = trashedJSON.map((item) => item.key);
    const removedItemKeys = deletedItemKeys.concat(trashedItemKeys);

    const deletePayload = removedItemKeys.map((removedItemKey) => ({
        deleteOne: {
            filter: { key: removedItemKey },
        },
    }));
    let patchPayload = [];

    if (patchedDataResponse.ok) {
        const splitPatches = patchedData.reduce(
            (result, currentItem) => {
                result[
                    currentItem.itemType === "attachment" ? "images" : "items"
                ].push(currentItem);
                return result;
            },
            { items: [], images: [] }
        );
        const patchedImages = splitPatches.images.map((image) => ({
            key: image.parentItem,
            image: image.url,
            alt: image.title,
        }));
        const patchedItems = splitPatches.items.map((item) => ({
            ...item,
            image: "",
            alt: "",
            ...patchedImages.find((image) => image.key === item.key),
        }));
        const remappedPatches = remapZoteroData(patchedItems);
        patchPayload = remappedPatches.map((remappedPatch) => ({
            replaceOne: {
                filter: { key: remappedPatch.key },
                replacement: remappedPatch,
                upsert: true,
            },
        }));
    } else {
        console.error(
            `Zotero patch request returned with response: ${patchedDataResponse.status} ${patchedDataResponse.statusText}.`
        );
    }

    const bulkWritePayload = deletePayload.concat(patchPayload);
    console.log(bulkWritePayload);
    const bulkWriteResult = bulkWritePayload.length
        ? await collection.bulkWrite(bulkWritePayload, {
              ordered: false,
          })
        : "Data already up to date";
    console.log(bulkWriteResult);

    const eventBody = JSON.parse(event.body);
    console.log(`Next function run at ${eventBody.next_run}.`);
    return {
        statusCode: 200,
    };
});
