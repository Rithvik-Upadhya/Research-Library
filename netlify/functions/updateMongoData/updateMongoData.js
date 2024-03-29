import { schedule } from '@netlify/functions';
import { MongoClient } from 'mongodb';
import remapZoteroData from '../../utils/remapZoteroData';
import fetch from 'node-fetch';

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = schedule('@hourly', async (event) => {
	const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
	const collection = database.collection(process.env.MONGODB_COLLECTION);
	const newestItem = await collection
		.find({})
		.sort({ version: -1 })
		.limit(1)
		.toArray();
	const currentDBVersion = newestItem[0].version;

	console.log(`Current MongoDB Version: ${currentDBVersion}`);

	const patchedDataURL = `https://api.zotero.org/groups/4433711/items?limit=100&format=json&v=3&since=${currentDBVersion}&itemType=-note`;
	const deletedDataURL = `https://api.zotero.org/groups/4433711/deleted?since=${currentDBVersion}`;
	const trashedDataURL = `https://api.zotero.org/groups/4433711/items/trash?limit=100&format=json&v=3&since=${currentDBVersion}`;

	const [patchedDataResponse, deletedDataResponse, trashedDataResponse] =
		await Promise.all([
			fetch(patchedDataURL, {
				headers: {
					'Zotero-API-Key': process.env.ZOTERO_API_KEY,
					'If-Modified-Since-Version': currentDBVersion,
				},
			}),
			fetch(deletedDataURL, {
				headers: {
					'Zotero-API-Key': process.env.ZOTERO_API_KEY,
				},
			}),
			fetch(trashedDataURL, {
				headers: {
					'Zotero-API-Key': process.env.ZOTERO_API_KEY,
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
	console.log('Patched Items:', patchedData);
	console.log('Deleted Items:', deletedItemKeys);
	console.log('Trashed Items:', trashedItemKeys);

	const deletePayload = removedItemKeys.map((removedItemKey) => ({
		deleteOne: {
			filter: { key: removedItemKey },
		},
	}));
	let patchItemsPayload = [];
	// let patchImagesPayload = [];

	if (patchedDataResponse.ok) {
		const splitPatches = patchedData.reduce(
			(result, currentItem) => {
				result[
					currentItem.itemType === 'attachment'
						? 'attachments'
						: 'items'
				].push(currentItem);
				return result;
			},
			{ items: [], attachments: [] }
		);
		const patchItems = remapZoteroData(splitPatches.items);
		patchItemsPayload = patchItems.map((remappedPatch) => ({
			replaceOne: {
				filter: { key: remappedPatch.key },
				replacement: remappedPatch,
				upsert: true,
			},
		}));
		// const patchImages = splitPatches.attachments.filter((attachment) =>
		//     /[^\s]+\.(?:png||jpe?g)$/i.test(attachment.url)
		// );
		// patchImagesPayload = patchImages.map((image) => ({
		//     updateOne: {
		//         filter: { key: image.parentItem },
		//         update: {
		//             $set: {
		//                 image: image.url,
		//                 alt: image.title,
		//                 version: image.version,
		//             },
		//         },
		//     },
		// }));
	} else {
		console.error(
			`Zotero patch request returned with response: ${patchedDataResponse.status} ${patchedDataResponse.statusText}.`
		);
	}

	const bulkWriteItemsPayload = deletePayload.concat(patchItemsPayload);
	console.log(
		`Bulk write items payload: ${JSON.stringify(bulkWriteItemsPayload)}`
	);
	const bulkWriteItemsResult = bulkWriteItemsPayload.length
		? await collection.bulkWrite(bulkWriteItemsPayload, {
				ordered: false,
		  })
		: 'Data already up to date';
	console.log('Bulk write items result: ', bulkWriteItemsResult);

	// console.log(
	//     `Bulk write images payload: ${JSON.stringify(patchImagesPayload)}`
	// );
	// const bulkWriteImagesResult = patchImagesPayload.length
	//     ? await collection.bulkWrite(patchImagesPayload, {
	//           ordered: false,
	//       })
	//     : "Images already up to date";
	// console.log("Bulk write images result: ", bulkWriteImagesResult);

	const eventBody = JSON.parse(event.body);
	console.log(`Next function run at ${eventBody.next_run}.`);
	return {
		statusCode: 200,
	};
});
