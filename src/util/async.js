import {AsyncStorage} from 'react-native';

export const asyncGet = async (key) => {
	let value;

	try {
		const valueString = await AsyncStorage.getItem(key);

		if (valueString) {
			value = JSON.parse(valueString);
		}
	} catch (error) {
		throw new Error(error);
	}

	return value;
};

export const asyncMultiGet = async (keys) => {
	const obj = {};

	try {
		await AsyncStorage.multiGet(keys).then((stores) => {
			stores.forEach((store) => {
				obj[store[0]] = store[1] ? JSON.parse(store[1]) : null;
			});
		});
	} catch (error) {
		return Promise.reject();
	}

	return obj;
};

export const asyncMultiRemove = async (arr) => {
	try {
		await AsyncStorage.multiRemove(arr);

		return Promise.resolve();
	} catch (error) {
		return Promise.reject();
	}
};

export const asyncMultiSet = async (obj) => {
	const keyValuePairs = [];

	Object.keys(obj).forEach((key) => {
		keyValuePairs.push([key, JSON.stringify(obj[key])]);
	});

	AsyncStorage.multiSet(keyValuePairs).catch((error) => {
		throw new Error(error);
	});
};

export const asyncRemove = async (key) => {
	try {
		await AsyncStorage.removeItem(key);

		return Promise.resolve();
	} catch (error) {
		return Promise.reject();
	}
};

export const asyncSet = async (key, value) => {
	AsyncStorage.setItem(key, JSON.stringify(value)).catch((error) => {
		throw new Error(error);
	});
};
