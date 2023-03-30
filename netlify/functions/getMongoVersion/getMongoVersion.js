import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export async function handler(event) {
    try {
        const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
        const collection = database.collection(process.env.MONGODB_COLLECTION);
        const newestItem = await collection
            .find({})
            .sort({ version: -1 })
            .limit(1)
            .toArray();
        const currentDBVersion = newestItem[0].version;

        return {
            statusCode: 200,
            headers: {
                "Content-type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(currentDBVersion),
        };
    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
}
