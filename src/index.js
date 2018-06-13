// const filePath = __dirname + '/../test/dance.csv';
const filePath = __dirname + '/../test/rehearsal.csv';

const fs = require('fs');
const parse = require('csv-parse');
const moment = require('moment');

const weekdays = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

fs.readFile(filePath, 'utf8', (err, data) => {
	if (err) throw err;

	parse(data, (err, table) => {
		if (err) throw err;
		console.log('table', table);
		simplify(table);
	});
});

/**
 * Row format
 *
 * 0 - Description
 * 1 - start_date
 * 2 - end_date
 * 3 - start_time
 * 4 - end_time
 * 5 - MRM_MeetingRoomName
 * 6 - resource_id
 * 7 - contact_person_id
 */

function simplify(table) {
	const dates = [];
	const datesLeft = [];

	function dateExists(target) {
		for (const date of datesLeft) {
			if (date.isSame(target)) {
				return true;
			}
		}
		return false;
	}

	function removeDate(target) {
		for (let i = 0; i < datesLeft.length; i++) {
			const date = datesLeft[i];
			if (date.isSame(target)) {
				datesLeft.splice(i, 1);
				return;
			}
		}
	}

	for (const row of table) {
		if (canGroup(row)) {
			dates.push(moment(row[1]));
			datesLeft.push(moment(row[1]));
		}
	}

	dates.sort((a, b) => {
		return a.valueOf() - b.valueOf();
	});
	datesLeft.sort((a, b) => {
		return a.valueOf() - b.valueOf();
	});

	/**
	 * Get dates reoccuring by week
	 */

	const reoccurances = [];
	for (let i = 0; i < dates.length; i++) {
		const date = dates[i];
		const checkDate = date.clone();
		const reoccuringDates = [ date ];

		if (!dateExists(date)) {
			continue;
		}

		while (true) {
			const nextWeek = checkDate.add(7, 'days');
			if (dateExists(nextWeek)) {
				reoccuringDates.push(nextWeek.clone());
				removeDate(nextWeek);
			} else {
				break;
			}
		}
		// console.log('reoccuring for', weekdays[date.day()], reoccuringDates);
		// reoccurances.push({
		// 	day: weekdays[date.day()],
		// 	dates: reoccuringDates
		// });
		reoccurances.push(reoccuringDates);
	}

	/**
	 * Order reoccurances by length
	 */

	const reoccuranceLengths = {};

	for (const reoccurance of reoccurances) {
		if (typeof reoccuranceLengths[reoccurance.length] !== 'object') {
			reoccuranceLengths[reoccurance.length] = [];
		}
		reoccuranceLengths[reoccurance.length].push(reoccurance);
	}

	reoccurances.sort((a, b) => {
		return b.length - a.length;
	});

	/**
	 * Group events that are on the same week
	 */

	const reservations = [];

	for (const length of Object.keys(reoccuranceLengths)) {
		const reoccurances = reoccuranceLengths[length];

		// Group by start of the week
		const weekGroups = reoccurances.reduce((acc, current) => {
			const key = momentToKeyString(current[0].clone().startOf('week'));
			if (typeof acc[key] !== 'object') {
				acc[key] = [];
			}
			acc[key].push(current);
			return acc;
		}, {});

		// Get grouped reoccurances range
		for (const startWeek of Object.keys(weekGroups)) {
			const weekReorruances = weekGroups[startWeek];
			const start = weekReorruances[0][0];
			const end = lastArrayItem(lastArrayItem(weekReorruances));

			// Find which weekdays to repeat
			const repeatWeekdays = [];

			for (const reoccurance of weekReorruances) {
				repeatWeekdays.push(reoccurance[0].day());
			}

			reservations.push({
				from: start,
				to: end,
				repeat: repeatWeekdays
			});
		}

		console.log('weeks', weekGroups);
	}

	console.log('reservations', reservations);

	// Group consecutive reoccurances
	// console.log('reoccurances', reoccuranceLengths);

}

function canGroup(row) {
	return row[1] === row[2];
}

function momentToKeyString(momentObj) {
	return momentObj.format('YYYY-MM-DD');
}

function lastArrayItem(array) {
	return array[array.length - 1];
}
