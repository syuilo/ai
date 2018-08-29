import * as loki from 'lokijs';

export default function(db: loki, name: string, opts?: any): loki.Collection {
	let collection;

	collection = db.getCollection(name);

	if (collection === null) {
		collection = db.addCollection(name, opts);
	}

	return collection;
}
