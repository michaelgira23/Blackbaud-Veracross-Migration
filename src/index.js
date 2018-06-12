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
		// console.log(table);

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
			// console.log('remove', target);
			for (let i = 0; i < datesLeft.length; i++) {
				const date = datesLeft[i];
				if (date.isSame(target)) {
					datesLeft.splice(i, 1);
					return;
				}
			}
			// console.log('dates left', datesLeft);
		}

		for (const row of table) {
			dates.push(moment(row[1]));
			datesLeft.push(moment(row[1]));
		}

		dates.sort((a, b) => {
			return a.valueOf() - b.valueOf();
		});
		datesLeft.sort((a, b) => {
			return a.valueOf() - b.valueOf();
		});

		console.log(dates);

		// Get dates reoccuring by week
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

		// Group consecutive reoccurances
		console.log('reoccurances', reoccuranceLengths);

	});
});
