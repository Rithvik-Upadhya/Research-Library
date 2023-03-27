import { client, q } from "../config/faunadb";

export const getAllZoteroData = client
    .query(q.Paginate(q.Match(q.Ref("indexes/all_zoteroData")), { size: 1000 }))
    .then((response) => {
        const dataRef = response.data;
        const getAllDataQuery = dataRef.map((ref) => q.Get(ref));
        return client
            .query(getAllDataQuery)
            .then((data) => data.map((item) => item.data));
    })
    .catch((error) => console.error("Error: ", error.message));

export const getZoteroFavourites = client
    .query(
        q.Paginate(q.Match(q.Ref("indexes/all_favourites"), true), {
            size: 100,
        })
    )
    .then((response) => {
        const dataRef = response.data;
        const getAllFavouritesQuery = dataRef.map((ref) => q.Get(ref));
        return client
            .query(getAllFavouritesQuery)
            .then((data) => data.map((item) => item.data));
    })
    .catch((error) => console.error("Error: ", error.message));
