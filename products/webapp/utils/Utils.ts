/**
* @namespace products.ext.util
*/

interface ExtractedUrlData {
id: string | null;
year: string | null;
month: string | null;
}

export default class Utils {
public extractDataFromUrl(url: string):
ExtractedUrlData {
const idRegex =/ID=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

const yearRegex = /year=(\d{4})/;
const monthRegex = /month=([a-zA-Z]+)/;

const idMatch = url.match(idRegex);
const yearMatch = url.match(yearRegex);
const monthMatch = url.match(monthRegex);

return {
id: idMatch ? idMatch[1] : null,
year: yearMatch ? yearMatch[1] : null,
month: monthMatch ? monthMatch[1] : null,
};
}
}