import remapZoteroData from '../../utils/remapZoteroData';
import { MongoClient } from 'mongodb';
import docs from '../../utils/docs';

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export async function handler(event) {
	try {
		const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
		const collection = database.collection(process.env.MONGODB_COLLECTION);

		const splitPatches = docs.reduce(
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

		const patchItemsResult = await collection.insertMany(patchItems);

		// const patchImages = splitPatches.attachments.filter((attachment) =>
		// 	/[^\s]+\.(?:png||jpe?g)$/i.test(attachment.url)
		// );

		// patchImagesPayload = patchImages.map((image) => ({
		// 	updateOne: {
		// 		filter: { key: image.parentItem },
		// 		update: {
		// 			$set: {
		// 				image: image.url,
		// 				alt: image.title,
		// 				version: image.version,
		// 			},
		// 		},
		// 	},
		// }));

		// const bulkWriteImagesResult = patchImagesPayload.length
		// 	? await collection.bulkWrite(patchImagesPayload, {
		// 			ordered: false,
		// 	  })
		// 	: 'Images already up to date';

		return {
			statusCode: 200,
			headers: {
				'Content-type': 'application/json; charset=utf-8',
			},
			body: JSON.stringify({
				patchedItemsResult: patchItemsResult,
				// patchImagesResult: bulkWriteImagesResult,
			}),
		};
	} catch (error) {
		return { statusCode: 500, body: error.toString() };
	}
}
