function createCheckboxObjs(prop, inputData) {
    const uniqueValues = [
        ...new Set(
            inputData.reduce((propsArray, resource) => {
                return propsArray.concat(resource[prop]);
            }, [])
        ),
    ].sort();
    const checkboxObjects = uniqueValues.map((uniqueValue) => ({
        value: uniqueValue,
        checked: false,
    }));
    return checkboxObjects;
}
export default function createQueryObj(inputData) {
    return {
        searchTerm: "",
        itemTypes: createCheckboxObjs("itemType", inputData),
        tags: createCheckboxObjs("tags", inputData),
    };
}
